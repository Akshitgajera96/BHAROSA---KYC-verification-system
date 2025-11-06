// ⏱️ Performance Tracking Utility for KYC Verification
import fs from 'fs/promises';
import path from 'path';

class PerformanceTracker {
  constructor() {
    this.sessions = new Map(); // Store timing data for each KYC record
    this.logDir = path.join(process.cwd(), 'logs', 'performance');
  }

  /**
   * Start tracking a KYC verification session
   */
  startSession(kycRecordId) {
    const session = {
      kycRecordId,
      startTime: Date.now(),
      steps: [],
      currentStep: null,
      metadata: {}
    };
    
    this.sessions.set(kycRecordId, session);
    console.log(`⏱️  [Performance] Started tracking session: ${kycRecordId}`);
    return session;
  }

  /**
   * Start tracking a specific step
   */
  startStep(kycRecordId, stepName, metadata = {}) {
    const session = this.sessions.get(kycRecordId);
    if (!session) {
      console.warn(`⚠️  [Performance] No session found for: ${kycRecordId}`);
      return;
    }

    // End previous step if exists
    if (session.currentStep) {
      this.endStep(kycRecordId);
    }

    const step = {
      name: stepName,
      startTime: Date.now(),
      startTimestamp: new Date().toISOString(),
      metadata,
      subSteps: []
    };

    session.currentStep = step;
    console.log(`⏱️  [${stepName}] Started`);
  }

  /**
   * Track a sub-step within a major step
   */
  trackSubStep(kycRecordId, subStepName, duration, metadata = {}) {
    const session = this.sessions.get(kycRecordId);
    if (!session || !session.currentStep) {
      return;
    }

    session.currentStep.subSteps.push({
      name: subStepName,
      duration,
      metadata,
      timestamp: new Date().toISOString()
    });

    console.log(`   ⏱️  [${subStepName}] ${duration}ms`);
  }

  /**
   * End the current step
   */
  endStep(kycRecordId, status = 'completed', error = null) {
    const session = this.sessions.get(kycRecordId);
    if (!session || !session.currentStep) {
      return;
    }

    const step = session.currentStep;
    const endTime = Date.now();
    const duration = endTime - step.startTime;

    step.endTime = endTime;
    step.endTimestamp = new Date().toISOString();
    step.duration = duration;
    step.status = status;
    step.error = error;

    session.steps.push(step);
    session.currentStep = null;

    const statusEmoji = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`${statusEmoji} [${step.name}] Completed in ${duration}ms (${(duration/1000).toFixed(2)}s)`);
  }

  /**
   * Add metadata to the session
   */
  addMetadata(kycRecordId, key, value) {
    const session = this.sessions.get(kycRecordId);
    if (session) {
      session.metadata[key] = value;
    }
  }

  /**
   * End the entire session and calculate totals
   */
  async endSession(kycRecordId, finalStatus = 'completed') {
    const session = this.sessions.get(kycRecordId);
    if (!session) {
      return null;
    }

    // End current step if still running
    if (session.currentStep) {
      this.endStep(kycRecordId, 'completed');
    }

    const endTime = Date.now();
    const totalDuration = endTime - session.startTime;

    session.endTime = endTime;
    session.endTimestamp = new Date().toISOString();
    session.totalDuration = totalDuration;
    session.finalStatus = finalStatus;

    // Calculate step durations
    const stepSummary = session.steps.map(step => ({
      name: step.name,
      duration: step.duration,
      durationSeconds: (step.duration / 1000).toFixed(2),
      percentage: ((step.duration / totalDuration) * 100).toFixed(1),
      status: step.status,
      subSteps: step.subSteps.length
    }));

    // Save to log file
    await this.saveToFile(session);

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log(`⏱️  VERIFICATION PERFORMANCE SUMMARY - ${kycRecordId}`);
    console.log('='.repeat(70));
    console.log(`Total Duration: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);
    console.log(`Final Status: ${finalStatus}`);
    console.log('\nStep Breakdown:');
    stepSummary.forEach((step, index) => {
      const emoji = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⚠️';
      console.log(`  ${index + 1}. ${emoji} ${step.name}`);
      console.log(`     Duration: ${step.durationSeconds}s (${step.percentage}%)`);
      if (step.subSteps > 0) {
        console.log(`     Sub-steps: ${step.subSteps}`);
      }
    });
    console.log('='.repeat(70) + '\n');

    // Clean up
    this.sessions.delete(kycRecordId);

    return {
      kycRecordId,
      totalDuration,
      totalDurationSeconds: (totalDuration / 1000).toFixed(2),
      steps: stepSummary,
      finalStatus,
      timestamp: session.endTimestamp
    };
  }

  /**
   * Get current session status
   */
  getSessionStatus(kycRecordId) {
    const session = this.sessions.get(kycRecordId);
    if (!session) {
      return null;
    }

    const currentDuration = Date.now() - session.startTime;
    const completedSteps = session.steps.length;
    const currentStepName = session.currentStep ? session.currentStep.name : null;
    const currentStepDuration = session.currentStep 
      ? Date.now() - session.currentStep.startTime 
      : 0;

    return {
      kycRecordId,
      currentDuration,
      currentDurationSeconds: (currentDuration / 1000).toFixed(2),
      completedSteps,
      currentStep: currentStepName,
      currentStepDuration,
      currentStepDurationSeconds: (currentStepDuration / 1000).toFixed(2),
      totalSteps: completedSteps + (currentStepName ? 1 : 0)
    };
  }

  /**
   * Save performance data to file
   */
  async saveToFile(session) {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDir, { recursive: true });

      const filename = `perf-${session.kycRecordId}-${Date.now()}.json`;
      const filepath = path.join(this.logDir, filename);

      await fs.writeFile(
        filepath,
        JSON.stringify(session, null, 2),
        'utf8'
      );

      console.log(`💾 Performance data saved: ${filepath}`);
    } catch (error) {
      console.error('❌ Failed to save performance data:', error.message);
    }
  }

  /**
   * Get all recent performance logs
   */
  async getRecentLogs(limit = 10) {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const files = await fs.readdir(this.logDir);
      
      const perfFiles = files
        .filter(f => f.startsWith('perf-') && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, limit);

      const logs = [];
      for (const file of perfFiles) {
        const content = await fs.readFile(path.join(this.logDir, file), 'utf8');
        logs.push(JSON.parse(content));
      }

      return logs;
    } catch (error) {
      console.error('❌ Failed to read performance logs:', error.message);
      return [];
    }
  }

  /**
   * Get performance statistics
   */
  async getStatistics() {
    const logs = await this.getRecentLogs(100);
    
    if (logs.length === 0) {
      return {
        totalVerifications: 0,
        averageDuration: 0,
        medianDuration: 0,
        minDuration: 0,
        maxDuration: 0
      };
    }

    const durations = logs.map(log => log.totalDuration).sort((a, b) => a - b);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const avg = total / durations.length;
    const median = durations[Math.floor(durations.length / 2)];

    // Calculate step averages
    const stepStats = {};
    logs.forEach(log => {
      log.steps.forEach(step => {
        if (!stepStats[step.name]) {
          stepStats[step.name] = { durations: [], count: 0 };
        }
        stepStats[step.name].durations.push(step.duration);
        stepStats[step.name].count++;
      });
    });

    const stepAverages = {};
    Object.keys(stepStats).forEach(stepName => {
      const durations = stepStats[stepName].durations;
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      stepAverages[stepName] = {
        average: avg,
        averageSeconds: (avg / 1000).toFixed(2),
        count: stepStats[stepName].count,
        min: Math.min(...durations),
        max: Math.max(...durations)
      };
    });

    return {
      totalVerifications: logs.length,
      averageDuration: avg,
      averageDurationSeconds: (avg / 1000).toFixed(2),
      medianDuration: median,
      medianDurationSeconds: (median / 1000).toFixed(2),
      minDuration: durations[0],
      minDurationSeconds: (durations[0] / 1000).toFixed(2),
      maxDuration: durations[durations.length - 1],
      maxDurationSeconds: (durations[durations.length - 1] / 1000).toFixed(2),
      stepAverages
    };
  }
}

// Create singleton instance
const performanceTracker = new PerformanceTracker();

export default performanceTracker;
