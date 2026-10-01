package com.focuskeeper.reboot.recovery.planning.config;

import com.focuskeeper.reboot.recovery.planning.service.Big3Service;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class Big3ExpirationBatchConfig {

    public static final String JOB_NAME = "big3ExpirationBatchJob";
    public static final String PROCESSED_ITEMS_KEY = "processedItems";

    @Bean
    public Job big3ExpirationBatchJob(
            JobRepository jobRepository,
            Step big3ExpirationStep
    ) {
        return new JobBuilder(JOB_NAME, jobRepository)
                .start(big3ExpirationStep)
                .build();
    }

    @Bean
    public Step big3ExpirationStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            Tasklet big3ExpirationTasklet
    ) {
        return new StepBuilder("big3ExpirationStep", jobRepository)
                .tasklet(big3ExpirationTasklet, transactionManager)
                .build();
    }

    @Bean
    @StepScope
    public Tasklet big3ExpirationTasklet(Big3Service big3Service) {
        return (contribution, chunkContext) -> {
            int processedItems = big3Service.expireLastWeekTasks();
            chunkContext.getStepContext()
                    .getStepExecution()
                    .getJobExecution()
                    .getExecutionContext()
                    .putInt(PROCESSED_ITEMS_KEY, processedItems);
            return RepeatStatus.FINISHED;
        };
    }
}
