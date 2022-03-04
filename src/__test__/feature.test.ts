import fs from 'fs';
import * as data from './samples';
import { Feature } from "../feature";


function fail(reason = "fail was called in a test.") {
  throw new Error(reason);
}

describe('Gherkin Feature tests', () => {
  
  let mockRead;

  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('should fail when an invalid file is specified', async () => {
    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('my unique error')
    }); 

    try {
      new Feature('invalid-feature');

      fail('should have an exception')
    } catch(err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('my unique error');
      expect(mockRead).toBeCalled();
    }

  });

  it('should fail when an gherkin syntax is not correct', async () => {
    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.invalidFeature;
    }); 


    try {
      new Feature('invalid-feature');

      fail('should have an exception')
    } catch(err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Cannot parse feature file');
      expect(mockRead).toBeCalled();
    }

  });


  it('should fail when a feature file is empty', async () => {
    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.emptyFeature;
    });

    try {
      new Feature('empty.feature');

      fail(`Should not reach here`);
    } catch(err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Cannot find feature or scenarios in file');
      expect(mockRead).toBeCalled();
    }
  });


  it('should succeed when an gherkin syntax is correct', async () => {
    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.validFeature;
    }) 

    let feature;
    try {
      feature = new Feature('valid.feature');


    } catch(err) {
      expect(err?.message).toBeUndefined();
      fail('Should not reach here');
    }
    expect(feature.featureFile).toContain('valid.feature');
    expect(feature.gherkin).toBeDefined();
    expect(feature.gherkin.feature).toBeDefined();
    expect(mockRead).toBeCalled();

  });

  it('should succeed when a markdown gherkin syntax is correct', async () => {

    mockRead = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return data.validMarkdown;
    });

    let feature;
    try {
      feature = new Feature('valid.md');
    } catch(err) {
      expect(err?.message).toBeUndefined();
      fail('Should not reach here');
    }
    expect(feature.featureFile).toContain('valid.md');
    expect(feature.gherkin).toBeDefined();
    expect(feature.gherkin.feature).toBeDefined();
    expect(mockRead).toBeCalled();

  });
});

