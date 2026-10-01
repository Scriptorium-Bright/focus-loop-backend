package com.focuskeeper.reboot.recovery.planning.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.focuskeeper.reboot.recovery.planning.service.Big3Service;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobInstance;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.scope.context.StepContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;

class Big3ExpirationBatchConfigTest {

    private final Big3ExpirationBatchConfig config = new Big3ExpirationBatchConfig();

    @Test
    void taskletStoresProcessedItemsInJobExecutionContext() throws Exception {
        Big3Service big3Service = mock(Big3Service.class);
        when(big3Service.expireLastWeekTasks()).thenReturn(42);
        JobExecution jobExecution = jobExecution();
        Tasklet tasklet = config.big3ExpirationTasklet(big3Service);

        RepeatStatus status = tasklet.execute(
                mock(StepContribution.class),
                chunkContext(jobExecution)
        );

        assertThat(status).isEqualTo(RepeatStatus.FINISHED);
        assertThat(jobExecution.getExecutionContext().getInt(
                Big3ExpirationBatchConfig.PROCESSED_ITEMS_KEY
        )).isEqualTo(42);
        verify(big3Service).expireLastWeekTasks();
    }

    @Test
    void taskletPropagatesExpirationFailure() {
        Big3Service big3Service = mock(Big3Service.class);
        when(big3Service.expireLastWeekTasks())
                .thenThrow(new IllegalStateException("database unavailable"));
        JobExecution jobExecution = jobExecution();
        Tasklet tasklet = config.big3ExpirationTasklet(big3Service);

        assertThatThrownBy(() -> tasklet.execute(
                mock(StepContribution.class),
                chunkContext(jobExecution)
        )).isInstanceOf(IllegalStateException.class)
                .hasMessage("database unavailable");

        assertThat(jobExecution.getExecutionContext().containsKey(
                Big3ExpirationBatchConfig.PROCESSED_ITEMS_KEY
        )).isFalse();
    }

    private JobExecution jobExecution() {
        JobInstance jobInstance = new JobInstance(1L, Big3ExpirationBatchConfig.JOB_NAME);
        return new JobExecution(jobInstance, new JobParameters());
    }

    private ChunkContext chunkContext(JobExecution jobExecution) {
        StepExecution stepExecution = new StepExecution("big3ExpirationStep", jobExecution);
        return new ChunkContext(new StepContext(stepExecution));
    }
}
