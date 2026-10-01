package com.focuskeeper.reboot.recovery.planning.config;

import com.focuskeeper.reboot.common.metrics.CoreMetricRecorder;
import io.micrometer.core.instrument.Timer;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class Big3ExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(Big3ExpirationJob.class);

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final JobLauncher jobLauncher;
    private final Job batchJob;
    private final CoreMetricRecorder coreMetricRecorder;

    public Big3ExpirationJob(
            JobLauncher jobLauncher,
            @Qualifier("big3ExpirationBatchJob") Job batchJob,
            CoreMetricRecorder coreMetricRecorder
    ) {
        this.jobLauncher = jobLauncher;
        this.batchJob = batchJob;
        this.coreMetricRecorder = coreMetricRecorder;
    }

    public ExpirationJobResult run() {
        return run("manual");
    }

    public ExpirationJobResult run(String trigger) {
        String runId = UUID.randomUUID().toString();
        if (!running.compareAndSet(false, true)) {
            coreMetricRecorder.recordExpirationSkipped("already_running");
            log.info(
                    "job=big3_expiration runId={} trigger={} status=skipped reason=already_running",
                    runId,
                    trigger
            );
            return ExpirationJobResult.skipped("already_running");
        }

        Timer.Sample sample = coreMetricRecorder.startSample();
        coreMetricRecorder.setExpirationRunning(true);
        long startedAt = System.nanoTime();
        try {
            JobParameters parameters = new JobParametersBuilder()
                    .addString("runId", runId)
                    .addString("trigger", trigger)
                    .addLong("requestedAt", System.currentTimeMillis())
                    .toJobParameters();
            JobExecution execution = jobLauncher.run(batchJob, parameters);
            if (execution.getStatus() != BatchStatus.COMPLETED) {
                throw new IllegalStateException(
                        "Big3 expiration batch did not complete successfully: " + execution.getStatus()
                );
            }

            int processedItems = execution.getExecutionContext()
                    .getInt(Big3ExpirationBatchConfig.PROCESSED_ITEMS_KEY, 0);
            coreMetricRecorder.recordExpirationSuccess(sample, processedItems);
            log.info(
                    "job=big3_expiration runId={} trigger={} status=success processedItems={} durationMs={}",
                    runId,
                    trigger,
                    processedItems,
                    elapsedMillis(startedAt)
            );
            return ExpirationJobResult.succeeded(processedItems);
        } catch (Error error) {
            coreMetricRecorder.recordExpirationFailure(sample);
            log.error(
                    "job=big3_expiration runId={} trigger={} status=failure durationMs={} errorCode={}",
                    runId,
                    trigger,
                    elapsedMillis(startedAt),
                    error.getClass().getSimpleName(),
                    error
            );
            throw error;
        } catch (Exception exception) {
            coreMetricRecorder.recordExpirationFailure(sample);
            log.error(
                    "job=big3_expiration runId={} trigger={} status=failure durationMs={} errorCode={}",
                    runId,
                    trigger,
                    elapsedMillis(startedAt),
                    exception.getClass().getSimpleName(),
                    exception
            );
            if (exception instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new IllegalStateException("Failed to launch Big3 expiration batch.", exception);
        } finally {
            coreMetricRecorder.setExpirationRunning(false);
            running.set(false);
        }
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
