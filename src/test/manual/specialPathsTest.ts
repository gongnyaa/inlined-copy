import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createTestFiles } from '../../utils/createTestFiles';

/**
 * Runs a manual test for special path handling
 * This creates test files with special characters and opens a main file that references them
 */
export async function runManualSpecialPathTest(): Promise<void> {
  // Get workspace folder
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Please open a workspace before running this test');
    return;
  }
  
  // Create test directory in workspace
  const testDir = path.join(workspaceFolder.uri.fsPath, 'test-special-paths');
  
  // Create test files with special characters
  const createdFiles = await createTestFiles(testDir);
  
  // Create a main file that references all test files
  const mainFile = path.join(testDir, 'main.md');
  let mainContent = '# Special Path Test\n\n';
  
  // Add references to each test file
  for (const file of createdFiles) {
    const relativePath = path.relative(testDir, file);
    mainContent += `![[${relativePath}]]\n\n`;
  }
  
  fs.writeFileSync(mainFile, mainContent);
  
  // Open the main file
  const doc = await vscode.workspace.openTextDocument(mainFile);
  await vscode.window.showTextDocument(doc);
  
  // Show instructions
  vscode.window.showInformationMessage(
    'Special path test: Run the "Inlined Copy: Expand and Copy" command from the command palette'
  );
}

/**
 * Runs a manual test for performance with large files
 * This creates large test files and opens a main file that references them
 */
export async function runManualPerformanceTest(): Promise<void> {
  // Get workspace folder
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Please open a workspace before running this test');
    return;
  }
  
  // Create test directory in workspace
  const testDir = path.join(workspaceFolder.uri.fsPath, 'test-performance');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create large test files
  const fileSizes = [100, 500, 1000, 5000]; // KB
  const createdFiles: string[] = [];
  
  for (const size of fileSizes) {
    const filePath = path.join(testDir, `large-${size}kb.txt`);
    
    // Generate content
    const oneKB = 'A'.repeat(1024);
    let content = `# Large file (${size}KB)\n\n`;
    for (let i = 0; i < size; i++) {
      content += oneKB;
    }
    
    fs.writeFileSync(filePath, content);
    createdFiles.push(filePath);
  }
  
  // Create a main file that references all test files
  const mainFile = path.join(testDir, 'main.md');
  let mainContent = '# Performance Test\n\n';
  
  // Add references to each test file
  for (const file of createdFiles) {
    const relativePath = path.relative(testDir, file);
    mainContent += `![[${relativePath}]]\n\n`;
  }
  
  fs.writeFileSync(mainFile, mainContent);
  
  // Open the main file
  const doc = await vscode.workspace.openTextDocument(mainFile);
  await vscode.window.showTextDocument(doc);
  
  // Show instructions
  vscode.window.showInformationMessage(
    'Performance test: Run the "Inlined Copy: Expand and Copy" command from the command palette and observe the time it takes'
  );
}

/**
 * Runs a manual test for circular references
 * This creates files with circular references and opens a main file that references them
 */
export async function runManualCircularReferenceTest(): Promise<void> {
  // Get workspace folder
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Please open a workspace before running this test');
    return;
  }
  
  // Create test directory in workspace
  const testDir = path.join(workspaceFolder.uri.fsPath, 'test-circular');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create files with circular references
  
  // 1. Self-reference
  const selfRefFile = path.join(testDir, 'self-reference.md');
  fs.writeFileSync(selfRefFile, `# Self Reference\n\nThis file references itself: ![[self-reference.md]]\n`);
  
  // 2. Two-file circular reference
  const fileA = path.join(testDir, 'fileA.md');
  const fileB = path.join(testDir, 'fileB.md');
  fs.writeFileSync(fileA, `# File A\n\nThis file references File B: ![[fileB.md]]\n`);
  fs.writeFileSync(fileB, `# File B\n\nThis file references File A: ![[fileA.md]]\n`);
  
  // 3. Three-file circular reference
  const fileX = path.join(testDir, 'fileX.md');
  const fileY = path.join(testDir, 'fileY.md');
  const fileZ = path.join(testDir, 'fileZ.md');
  fs.writeFileSync(fileX, `# File X\n\nThis file references File Y: ![[fileY.md]]\n`);
  fs.writeFileSync(fileY, `# File Y\n\nThis file references File Z: ![[fileZ.md]]\n`);
  fs.writeFileSync(fileZ, `# File Z\n\nThis file references File X: ![[fileX.md]]\n`);
  
  // Create a main file that references all test files
  const mainFile = path.join(testDir, 'main.md');
  const mainContent = `# Circular Reference Test

## Self Reference
![[self-reference.md]]

## Two-file Circular Reference
![[fileA.md]]

## Three-file Circular Reference
![[fileX.md]]
`;
  
  fs.writeFileSync(mainFile, mainContent);
  
  // Open the main file
  const doc = await vscode.workspace.openTextDocument(mainFile);
  await vscode.window.showTextDocument(doc);
  
  // Show instructions
  vscode.window.showInformationMessage(
    'Circular reference test: Run the "Inlined Copy: Expand and Copy" command from the command palette and observe how circular references are handled'
  );
}
