import Gherkin = require('@cucumber/gherkin');
import Messages = require('@cucumber/messages');
import path = require('path');

import * as fs from 'fs'

export const loadGherkin = (gherkinFile: string) => {
  let featureText: string;
  try {
    featureText = fs.readFileSync(gherkinFile,'utf8');
  } catch(err) {
    throw new Error(`Cannot read feature file ${gherkinFile}: ${err.message}`)
  }

  return parseGherkin(featureText, path.parse(gherkinFile).ext.toLowerCase() === '.md');
}

export const parseGherkin = (featureText: string, markDown = false) => {

  const uuidFn = Messages.IdGenerator.uuid()
  const builder = new Gherkin.AstBuilder(uuidFn)
  const matcher = markDown ? new Gherkin.GherkinInMarkdownTokenMatcher() : new Gherkin.GherkinClassicTokenMatcher();
  const parser = new Gherkin.Parser(builder, matcher);

  let gherkin;
  try {
    gherkin = parser.parse(featureText);
  } catch(err) {
    // TODO add line info if possible
    throw new Error(`Cannot parse gherkin feature: ${err.message}`)
  }

  if(!Array.isArray(gherkin.feature?.children) || gherkin.feature?.children.find(element => element.scenario != null) == null) {
    throw new Error(`Cannot find scenarios in gherkin feature`);
  }

  return gherkin;

}