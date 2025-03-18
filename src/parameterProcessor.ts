import * as vscode from 'vscode';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';

/**
 * Processes parameter placeholders in the format {{parameter}} or {{parameter=defaultValue}}
 */
export class ParameterProcessor {
  /**
   * Processes parameter placeholders in the given text
   * @param text The text containing parameter placeholders
   * @param currentDepth Current recursion depth (default: 0)
   * @returns The processed text with parameter placeholders replaced by user input
   */
  public static async processParameters(text: string, currentDepth = 0): Promise<string> {
    LogManager.debug(`Processing parameters at depth ${currentDepth}`);
    // Get maximum parameter recursion depth from configuration
    const MAX_PARAM_RECURSION_DEPTH = VSCodeEnvironment.getConfiguration('inlined-copy', 'maxParameterRecursionDepth', 1);
    
    // Check if recursion depth exceeds limit
    if (currentDepth > MAX_PARAM_RECURSION_DEPTH) {
      LogManager.debug(`Recursion depth ${currentDepth} exceeds maximum ${MAX_PARAM_RECURSION_DEPTH}, returning text as is.`);
      return text;
    }
    
    // Regular expression to match {{parameter}} or {{parameter=defaultValue}} patterns
    const paramRegex = /\{\{([^=}]+)(?:=([^}]+))?\}\}/g;
    
    let result = text;
    let match;
    
    // Find all unique parameters in the text
    const parameters = new Map<string, string>();
    const matches: { fullMatch: string; paramName: string; defaultValue?: string }[] = [];
    
    while ((match = paramRegex.exec(text)) !== null) {
      const fullMatch = match[0]; // The entire {{parameter}} or {{parameter=defaultValue}} match
      const paramName = match[1].trim(); // The parameter name
      const defaultValue = match[2] ? match[2].trim() : undefined; // The default value if provided
      
      matches.push({ fullMatch, paramName, defaultValue });
      
      // Only prompt for each unique parameter once
      if (!parameters.has(paramName)) {
        parameters.set(paramName, defaultValue || '');
      }
    }
    
    // Prompt the user for parameter values
    for (const [paramName, defaultValue] of parameters.entries()) {
      const value = await this.promptForParameterValue(paramName, defaultValue);
      parameters.set(paramName, value);
    }
    
    // Replace all parameter placeholders with their values
    for (const { fullMatch, paramName } of matches) {
      const value = parameters.get(paramName) || '';
      result = result.replace(fullMatch, value);
    }
    
    return result;
  }
  
  /**
   * Prompts the user for a parameter value
   * @param paramName The name of the parameter
   * @param defaultValue The default value for the parameter
   * @returns The user input or default value
   */
  private static async promptForParameterValue(paramName: string, defaultValue: string): Promise<string> {
    const options: vscode.InputBoxOptions = {
      prompt: `Enter value for parameter "${paramName}"`,
      value: defaultValue,
      placeHolder: defaultValue ? `Default: ${defaultValue}` : 'Enter value...'
    };
    
    const value = await vscode.window.showInputBox(options);
    
    // If user cancels, use default value or empty string
    return value !== undefined ? value : defaultValue || '';
  }
}
