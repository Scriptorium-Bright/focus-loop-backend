package com.focuskeeper.reboot.recovery.planning.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.focuskeeper.reboot.common.metrics.CoreMetricRecorder;
import com.focuskeeper.reboot.recovery.planning.constant.ExpirationJobStatus;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobInstance;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.launch.JobLauncher;

class Big3ExpirationJobTest {

    @Test
    void successfulRunRecordsProcessedItemsDurationAndLastSuccess() throws Exception {
        JobLauncher jobLauncher = mock(JobLauncher.class);
        Job batchJob = mock(Job.class);
        when(jobLauncher.run(any(Job.class), any(JobParameters.class)))
                .thenReturn(completedExecution(42));
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        Big3ExpirationJob job = job(jobLauncher, batchJob, meterRegistry);

        ExpirationJobResult result = job.run("test");

        assertThat(result.expirationJobStatus()).isEqualTo(ExpirationJobStatus.SUCCEEDED);
        assertThat(result.processedItems()).isEqualTo(42);
        assertThat(result.reason()).isNull();
        verify(jobLauncher).run(any(Job.class), any(JobParameters.class));
        assertThat(counter(meterRegistry, "focusloop_expiration_runs_total", "status", "success"))
                .isEqualTo(1.0);
        assertThat(meterRegistry.get("focusloop_expiration_duration").tag("status", "success").timer().count())
                .isEqualTo(1);
        assertThat(meterRegistry.get("focusloop_expiration_processed_items").summary().totalAmount())
                .isEqualTo(42.0);
        assertThat(meterRegistry.get("focusloop_expiration_last_success_timestamp_seconds").gauge().value())
                .isPositive();
        assertThat(meterRegistry.get("focusloop_expiration_last_duration_seconds").gauge().value())
                .isGreaterThanOrEqualTo(0.0);
        assertThat(meterRegistry.get("focusloop_expiration_running").gauge().value()).isZero();
    }

    @Test
    void failedRunRecordsFailureAndReleasesRunningState() throws Exception {
        JobLauncher jobLauncher = mock(JobLauncher.class);
        Job batchJob = mock(Job.class);
        when(jobLauncher.run(any(Job.class), any(JobParameters.class)))
                .thenThrow(new IllegalStateException("database unavailable"));
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        Big3ExpirationJob job = job(jobLauncher, batchJob, meterRegistry);

        assertThatThrownBy(() -> job.run("test"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("database unavailable");

        assertThat(counter(meterRegistry, "focusloop_expiration_runs_total", "status", "failure"))
                .isEqualTo(1.0);
        assertThat(meterRegistry.get("focusloop_expiration_duration").tag("status", "failure").timer().count())
                .isEqualTo(1);
        assertThat(meterRegistry.get("focusloop_expiration_last_duration_seconds").gauge().value())
                .isGreaterThanOrEqualTo(0.0);
        assertThat(meterRegistry.get("focusloop_expiration_running").gauge().value()).isZero();
    }

    @Test
    void concurrentRunIsSkippedWhileFirstRunOwnsTheJob() throws Exception {
        JobLauncher jobLauncher = mock(JobLauncher.class);
        Job batchJob = mock(Job.class);
        CountDownLatch enteredLauncher = new CountDownLatch(1);
        CountDownLatch releaseLauncher = new CountDownLatch(1);
        doAnswer(invocation -> {
            enteredLauncher.countDown();
            if (!releaseLauncher.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("batch release timed out");
            }
            return completedExecution(7);
        }).when(jobLauncher).run(any(Job.class), any(JobParameters.class));

        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        Big3ExpirationJob job = job(jobLauncher, batchJob, meterRegistry);
        ExecutorService executor = Executors.newSingleThreadExecutor();

        try {
            Future<ExpirationJobResult> firstRun = executor.submit(() -> job.run("test"));
            assertThat(enteredLauncher.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(meterRegistry.get("focusloop_expiration_running").gauge().value()).isEqualTo(1.0);

            ExpirationJobResult skipped = job.run("test");
            assertThat(skipped.expirationJobStatus()).isEqualTo(ExpirationJobStatus.SKIPPED);
            assertThat(skipped.reason()).isEqualTo("already_running");

            releaseLauncher.countDown();
            ExpirationJobResult succeeded = firstRun.get(5, TimeUnit.SECONDS);
            assertThat(succeeded.processedItems()).isEqualTo(7);

            verify(jobLauncher).run(any(Job.class), any(JobParameters.class));
            assertThat(counter(
                    meterRegistry,
                    "focusloop_expiration_skipped_runs_total",
                    "reason",
                    "already_running"
            )).isEqualTo(1.0);
            assertThat(counter(meterRegistry, "focusloop_expiration_runs_total", "status", "success"))
                    .isEqualTo(1.0);
            assertThat(meterRegistry.get("focusloop_expiration_running").gauge().value()).isZero();
        } finally {
            releaseLauncher.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    private Big3ExpirationJob job(
            JobLauncher jobLauncher,
            Job batchJob,
            SimpleMeterRegistry meterRegistry
    ) {
        return new Big3ExpirationJob(
                jobLauncher,
                batchJob,
                new CoreMetricRecorder(meterRegistry)
        );
    }

    private JobExecution completedExecution(int processedItems) {
        JobInstance jobInstance = new JobInstance(1L, Big3ExpirationBatchConfig.JOB_NAME);
        JobExecution execution = new JobExecution(jobInstance, new JobParameters());
        execution.setStatus(BatchStatus.COMPLETED);
        execution.getExecutionContext().putInt(
                Big3ExpirationBatchConfig.PROCESSED_ITEMS_KEY,
                processedItems
        );
        return execution;
    }

    private double counter(
            SimpleMeterRegistry meterRegistry,
            String name,
            String tagKey,
            String tagValue
    ) {
        return meterRegistry.get(name)
                .tag(tagKey, tagValue)
                .counter()
                .count();
    }
}
