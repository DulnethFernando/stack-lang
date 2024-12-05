class StackLang {
    constructor() {
        this.stack = [];
        this.variables = {};
        this.functions = {};
        this.output = [];
        this.currentIndent = 0;
        this.blockStack = [];
    }

    push(value) {
        this.stack.push(value);
        console.log(`Pushed ${value}, Stack is now: ${JSON.stringify(this.stack)}`);
    }

    pop() {
        if (this.stack.length === 0) {
            throw new Error('Stack underflow - tried to pop from empty stack');
        }
        return this.stack.pop();
    }

    peek() {
        if (this.stack.length === 0) {
            throw new Error('Stack underflow - tried to peek empty stack');
        }
        return this.stack[this.stack.length - 1];
    }

    executeProgram(code, isFunction = false) {
        if (!isFunction) {
            this.stack = [];
            this.output = [];
        }
        
        const lines = code.split('\n');
        let i = 0;
        let currentIndent = 0;
        let blockStack = [];
        
        while (i < lines.length) {
            const line = lines[i].trimEnd();
            const indent = this.getIndentLevel(line);
            const trimmedLine = line.trim();
            
            if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                i++;
                continue;
            }

            console.log(`Processing line: "${trimmedLine}", indent: ${indent}, currentIndent: ${currentIndent}`);

            if (indent < currentIndent) {
                while (blockStack.length > 0 && indent < currentIndent) {
                    blockStack.pop();
                    currentIndent -= 4;
                }
            }

            if (trimmedLine.startsWith('def ')) {
                // Function definition
                const funcName = trimmedLine.slice(4, -1); // Remove 'def ' and ':'
                let functionBody = [];
                i++;
                const defIndent = indent;
                
                // Collect function body
                while (i < lines.length) {
                    const bodyLine = lines[i].trimEnd();
                    const bodyIndent = this.getIndentLevel(bodyLine);
                    if (bodyIndent <= defIndent && bodyLine.trim() !== '') {
                        break;
                    }
                    functionBody.push(bodyLine);
                    i++;
                }
                
                this.functions[funcName] = functionBody.join('\n');
                console.log(`Defined function ${funcName}:\n${this.functions[funcName]}`);
                continue;
            }

            if (trimmedLine.startsWith('if:')) {
                // If statement
                const condition = this.pop();
                console.log(`If condition: ${condition}`);
                if (condition) {
                    // Execute the if block
                    blockStack.push('if');
                    currentIndent += 4;
                    i++;
                } else {
                    // Skip to else block
                    i++;
                    let elseFound = false;
                    while (i < lines.length) {
                        const nextLine = lines[i].trimEnd();
                        const nextIndent = this.getIndentLevel(nextLine);
                        const nextTrimmed = nextLine.trim();
                        
                        if (nextIndent === indent && nextTrimmed === 'else:') {
                            elseFound = true;
                            blockStack.push('else');
                            currentIndent += 4;
                            break;
                        } else if (nextIndent <= indent) {
                            break;
                        }
                        i++;
                    }
                    if (!elseFound) {
                        continue;
                    }
                }
                continue;
            }

            if (trimmedLine === 'else:') {
                // Skip the else block if we executed the if block
                const lastBlock = blockStack[blockStack.length - 1];
                if (lastBlock === 'if') {
                    i++;
                    while (i < lines.length) {
                        const nextLine = lines[i].trimEnd();
                        const nextIndent = this.getIndentLevel(nextLine);
                        if (nextIndent <= indent) {
                            break;
                        }
                        i++;
                    }
                    blockStack.pop();
                    currentIndent -= 4;
                    continue;
                }
                i++;
                continue;
            }

            // Execute the instruction
            this.executeInstruction(trimmedLine);
            i++;
        }

        return {
            stack: this.stack,
            output: this.output,
            variables: this.variables
        };
    }

    getIndentLevel(line) {
        let indent = 0;
        while (indent < line.length && line[indent] === ' ') {
            indent++;
        }
        return indent;
    }

    executeInstruction(instruction) {
        const tokens = instruction.split(' ');
        const command = tokens[0].trim();

        console.log(`\nExecuting: ${instruction}`);
        console.log(`Stack before: ${JSON.stringify(this.stack)}`);

        try {
            if (command === 'push') {
                this.push(Number(tokens[1]));
            } else if (command === 'print') {
                const value = this.pop();
                this.output.push(String(value));
                this.push(value); // Put it back
            } else if (command === 'println') {
                const value = this.pop();
                this.output.push(String(value) + '\n');
                this.push(value); // Put it back
                console.log(`Printed value: ${value}`);
            } else if (command === 'dup') {
                const value = this.peek();
                this.push(value);
            } else if (command === 'swap') {
                const a = this.pop();
                const b = this.pop();
                this.push(a);
                this.push(b);
            } else if (command === 'drop') {
                this.pop();
            } else if (command === '+') {
                const b = this.pop();
                const a = this.pop();
                const result = a + b;
                this.push(result);
                console.log(`Addition: ${a} + ${b} = ${result}`);
            } else if (command === '-') {
                const b = this.pop();
                const a = this.pop();
                const result = a - b;
                this.push(result);
                console.log(`Subtraction: ${a} - ${b} = ${result}`);
            } else if (command === '*') {
                const b = this.pop();
                const a = this.pop();
                const result = a * b;
                this.push(result);
                console.log(`Multiplication: ${a} * ${b} = ${result}`);
            } else if (command === '/') {
                const b = this.pop();
                const a = this.pop();
                if (b === 0) throw new Error('Division by zero');
                this.push(a / b);
            } else if (command === 'mod') {
                const b = this.pop();
                const a = this.pop();
                if (b === 0) throw new Error('Modulo by zero');
                this.push(a % b);
            } else if (command === '=') {
                const b = this.pop();
                const a = this.pop();
                const result = Number(a === b);
                this.push(result);
                console.log(`Comparison ${a} = ${b} result: ${result}`);
            } else if (command === '<') {
                const b = this.pop();
                const a = this.pop();
                this.push(Number(a < b));
            } else if (command === '>') {
                const b = this.pop();
                const a = this.pop();
                this.push(Number(a > b));
            } else if (command.startsWith('if') || command === 'else' || command === 'endif') {
                // These are handled by the block parser
                return;
            } else if (this.functions[instruction]) {
                // Function call
                console.log(`\nCalling function: ${instruction}`);
                const functionBody = this.functions[instruction];
                
                // Save current stack state
                const savedStack = [...this.stack];
                console.log(`Saved stack state: ${JSON.stringify(savedStack)}`);
                
                // Execute function
                this.executeProgram(functionBody, true);
                
                // Get result and restore previous stack state
                if (this.stack.length === 0) {
                    throw new Error('Function returned with empty stack');
                }
                const result = this.pop();
                console.log(`Function result before restore: ${result}`);
                this.stack = [...savedStack]; // Make a copy to prevent reference issues
                if (this.stack.length > 0) {
                    this.stack.pop(); // Remove the input value
                }
                this.push(result); // Push the result
                
                console.log(`Function ${instruction} returned: ${result}`);
                console.log(`Stack after function: ${JSON.stringify(this.stack)}`);
            } else {
                throw new Error(`Unknown instruction: ${instruction}`);
            }
        } catch (error) {
            console.error(`Error during instruction "${instruction}":`, error);
            throw error;
        }

        console.log(`Stack after: ${JSON.stringify(this.stack)}\n`);
    }

    displayOutput() {
        const outputDiv = document.getElementById('output');
        outputDiv.innerHTML = '';  // Clear previous output
        
        if (this.output.length === 0) {
            outputDiv.textContent = 'No output';
            return;
        }
        
        // Join all output with proper line breaks
        outputDiv.textContent = this.output.join('');
    }
}

// UI Integration
document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const runButton = document.getElementById('runButton');
    const output = document.getElementById('output');

    // Add copy functionality
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const code = button.nextElementSibling.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.background = '#16a34a';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 1500);
            });
        });
    });

    runButton.addEventListener('click', () => {
        // Create a new interpreter instance for each execution
        const interpreter = new StackLang();
        
        try {
            const result = interpreter.executeProgram(codeInput.value);
            
            interpreter.displayOutput();
            
            let outputText = '\n\nStack:\n';
            outputText += result.stack.length > 0 ? `[${result.stack.join(', ')}]` : '[empty]';
            
            if (Object.keys(result.variables).length > 0) {
                outputText += '\n\nVariables:\n';
                for (const [name, value] of Object.entries(result.variables)) {
                    outputText += `${name}: ${value}\n`;
                }
            }

            output.textContent += outputText;
            output.style.color = '#d4d4d4';  // Light gray color for better visibility
        } catch (error) {
            output.textContent = `Error: ${error.message}`;
            output.style.color = '#e74c3c';
        }
    });
});
