/**
 * Service for executing code in the browser using WASM (Pyodide) for Python
 * and native JS execution for JavaScript.
 */

declare global {
    interface Window {
        loadPyodide: any;
    }
}

class CodeExecutionService {
    private pyodide: any = null;
    private isInitializing: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    /**
     * Initialize Pyodide if it hasn't been initialized yet.
     */
    async initPyodide() {
        if (this.pyodide) return;
        if (this.isInitializing) return this.initializationPromise;

        this.isInitializing = true;
        this.initializationPromise = (async () => {
            try {
                // Load Pyodide script if not already present
                if (!window.loadPyodide) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
                    document.head.appendChild(script);

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });
                }

                this.pyodide = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
                    stdout: (text: string) => {
                        this.capturedOutput += text + '\n';
                    },
                    stderr: (text: string) => {
                        this.capturedOutput += text + '\n';
                    }
                });
            } catch (error) {
                console.error('Failed to initialize Pyodide:', error);
                this.isInitializing = false;
                throw error;
            }
        })();

        return this.initializationPromise;
    }

    private capturedOutput: string = '';

    /**
     * Execute Python code using Pyodide.
     */
    async executePython(code: string): Promise<{ output: string; error?: string }> {
        await this.initPyodide();
        this.capturedOutput = '';

        try {
            // Redirect stdout to our capturedOutput
            await this.pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);

            await this.pyodide.runPythonAsync(code);

            const stdout = await this.pyodide.runPythonAsync('sys.stdout.getvalue()');
            const stderr = await this.pyodide.runPythonAsync('sys.stderr.getvalue()');

            return {
                output: stdout,
                error: stderr || undefined
            };
        } catch (error: any) {
            return {
                output: this.capturedOutput,
                error: error.message
            };
        }
    }

    /**
     * Execute JavaScript code in the browser.
     */
    async executeJavaScript(code: string): Promise<{ output: string; error?: string }> {
        let output = '';
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        // Override console methods to capture output
        const capture = (...args: any[]) => {
            output += args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ') + '\n';
        };

        console.log = capture;
        console.error = capture;
        console.warn = capture;
        console.info = capture;

        try {
            // Use new Function to execute code in a somewhat isolated scope
            const fn = new Function(code);
            const result = fn();

            if (result !== undefined) {
                output += `Return value: ${JSON.stringify(result, null, 2)}\n`;
            }

            return { output };
        } catch (error: any) {
            return {
                output,
                error: error.message
            };
        } finally {
            // Restore original console methods
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
        }
    }

    /**
     * General execute method.
     */
    async execute(code: string, language: string): Promise<{ output: string; error?: string }> {
        if (language === 'python') {
            return this.executePython(code);
        } else if (language === 'javascript') {
            return this.executeJavaScript(code);
        } else {
            return {
                output: '',
                error: `Language ${language} is not supported for client-side execution.`
            };
        }
    }
}

export const codeExecutionService = new CodeExecutionService();
