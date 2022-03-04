import fs from 'fs';
import log = require('npmlog');

import { loadGherkin } from '../gherkin';
import * as data from '../../__test__/samples';

function fail(reason = "fail was called in a test.") {
  throw new Error(reason);
}

describe('Gherkin loader tests', () => {
  
  let mockRead;

  let logErrors = [];
  let logInfos = [];

  afterEach(() => {
    // mockRead.mockRestoreAll();
    jest.restoreAllMocks();
    logErrors = [];
    logInfos = [];
  })

  log.on('log.error', logErrors.push.bind(logErrors));
  log.on('log.info', logInfos.push.bind(logInfos));

  it('should fail if the file is not found', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('my unique error')
    }); 

    try {
      loadGherkin('some invalid file');

      fail('should not reach here');
    } catch(err) {
      expect(err).toBeDefined();
      expect(err.message).toContain('my unique error');
      expect(mockRead).toBeCalled();
    }
  });

  it('should fail if the feature contains errors', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.invalidFeature;
    });


    try {
      loadGherkin('some invalid file');
      fail('should not reach here');
    } catch(err) {
      expect(err).toBeDefined();
      expect(err.message).toContain('Cannot parse gherkin feature');
      expect(mockRead).toBeCalled();
    }

  });

  it('should fail when a feature file is empty', async () => {
    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.emptyFeature;
    });

    try {
      loadGherkin('some invalid file');
      fail('should not reach here');
    } catch(err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Cannot find scenarios in gherkin feature');
      expect(mockRead).toBeCalled();
    }
  });


  it('should return a feature object if it can parse', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.validFeature;
    });

    let gherkin;
    try {
      gherkin = loadGherkin('valid.feature')
    } catch(err) {
      fail('should not reach here')
    }

    expect(gherkin).toHaveProperty('feature');
  });

  it('should return a feature object if it can parse a markdown file', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.validMarkdown;
    });

    let gherkin;
    try {
      gherkin = loadGherkin('valid.md')
    } catch(err) {
      fail('should not reach here')
    }

    expect(gherkin).toHaveProperty('feature');
  });

});