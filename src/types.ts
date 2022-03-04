

export class BdhStatus {
  numFiles      = 0;
  numScenarios  = 0;
  numMissing    = 0;
  numDeleted    = 0;
  numErrors     = 0;
  numFileErrors = 0;

  addFile(cnt = 1) {
    this.numFiles += cnt;
  }

  addError(cnt = 1) {
    this.numErrors += cnt;
  }

  addFileError(cnt = 1) {
    this.numFileErrors += cnt;
  }

  addScenario(cnt = 1) {
    this.numScenarios += cnt;
  }

  merge(other: BdhStatus) {
    this.numFiles += other.numFiles;
    this.numScenarios += other.numScenarios;
    this.numMissing += other.numMissing;
    this.numDeleted += other.numDeleted;
    this.numErrors += other.numErrors; 
    this.numFileErrors += other.numFileErrors;
  }

  reset() {
    this.numFiles      = 0;
    this.numScenarios  = 0;
    this.numMissing    = 0;
    this.numDeleted    = 0;
    this.numErrors     = 0;
    this.numFileErrors = 0;
  
  }
}