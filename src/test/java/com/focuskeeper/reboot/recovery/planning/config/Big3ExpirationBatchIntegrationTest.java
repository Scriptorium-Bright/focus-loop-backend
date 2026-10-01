package com.focuskeeper.reboot.recovery.planning.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.focuskeeper.reboot.recovery.planning.service.Big3Service;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class Big3ExpirationBatchIntegrationTest {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    @Qualifier("big3ExpirationBatchJob")
    private Job batchJob;

    @MockBean
    private Big3Service big3Service;

    @Test
    void launchesSpringBatchJobAndPublishesProcessedItems() throws Exception {
        when(big3Service.expireLastWeekTasks()).thenReturn(42);
        JobParameters parameters = new JobParametersBuilder()
                .addString("runId", UUID.randomUUID().toString())
                .addString("trigger", "integration-test")
                .addLong("requestedAt", System.currentTimeMillis())
                .toJobParameters();

        JobExecution execution = jobLauncher.run(batchJob, parameters);

        assertThat(execution.getStatus()).isEqualTo(BatchStatus.COMPLETED);
        assertThat(execution.getExecutionContext().getInt(
                Big3ExpirationBatchConfig.PROCESSED_ITEMS_KEY
        )).isEqualTo(42);
        verify(big3Service).expireLastWeekTasks();
    }
}
