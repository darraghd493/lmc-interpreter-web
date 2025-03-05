"use client";

import { Checkbox } from "@/components/Checkbox";
import { TextBox } from "@/components/TextBox";
import { Interpreter, Parser } from "lmc-interpreter";
import { useEffect, useState } from "react";

// TODO: Implement configuration for the interpreter
export default function Page() {
  // Interpreter state
  const [script, setScript] = useState<string>(`INP
STA in_a
INP
STA in_b
LDA in_a
ADD in_b
OUT
HLT

in_a DAT
in_b DAT
`);
  const [output, setOutput] = useState<string>("");
  const [log, setLog] = useState<string>("");
  const [activeInterpreter, setActiveInterpreter] = useState<null | Interpreter>(null);

  // Settings state
  const [settings, setSettings] = useState<boolean>(false);

  const [comments, setComments] = useState<boolean>(true);
  const [commentsSequence, setCommentsSequence] = useState<string>("//");
  const [splitLines, setSplitLines] = useState<boolean>(true);
  const [splitLinesSequence, setSplitLinesSequence] = useState<string>(";");
  const [memorySize, setMemorySize] = useState<number>(32747);
  const [dump, setDump] = useState<boolean>(false);
  const [stepInterval, setStepInterval] = useState<number>(1);

  const updateSettings = () => {
    if (isInvalidSequences()) return;
    localStorage.setItem("comments", comments.toString());
    localStorage.setItem("commentsSequence", commentsSequence);
    localStorage.setItem("splitLines", splitLines.toString());
    localStorage.setItem("splitLinesSequence", splitLinesSequence);
    localStorage.setItem("memorySize", memorySize.toString());
    localStorage.setItem("dump", dump.toString());
    localStorage.setItem("stepInterval", stepInterval.toString());
    console.log("Settings saved to local storage.");
  }

  const loadSettings = () => {
    setComments(localStorage.getItem("comments") === "true" || true);
    setCommentsSequence(localStorage.getItem("commentsSequence") || "//");
    setSplitLines(localStorage.getItem("splitLines") === "true" || true);
    setSplitLinesSequence(localStorage.getItem("splitLinesSequence") || ";");
    setMemorySize(parseInt(localStorage.getItem("memorySize") || "32747", 10));
    setDump(localStorage.getItem("dump") === "true" || false);
    setStepInterval(parseInt(localStorage.getItem("stepInterval") || "1", 10));
  }

  const isInvalidSequences = () => comments && splitLines && (commentsSequence.startsWith(splitLinesSequence) || splitLinesSequence.startsWith(commentsSequence));
  const isInvalidSettings = () => isInvalidSequences(); // Redundant, but for clarity - may be used for future settings

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle interpreter
  useEffect(() => {
    setOutput("");
    setLog("");
    
    if (activeInterpreter) {
      const interpreter = activeInterpreter;
      interpreter.initialise();
      
      const interval = setInterval(() => {
        try {
          if (!interpreter.step()) {
            clearInterval(interval);
          } else if (dump) {
            setLog((prev) => prev + `PC: ${interpreter.state.programCounter}, ACC: ${interpreter.state.accumulator}, IR: ${interpreter.state.instructionRegister}, AR: ${interpreter.state.addressRegister}\n`);
          }
        } catch (error) {
          setOutput((prev) => prev + "------------------------" + error + "\n");
          clearInterval(interval);
        }
      }, stepInterval || 1);
    }
  }, [activeInterpreter, dump, stepInterval]);

  const runScript = () => {
    if (activeInterpreter) {
      activeInterpreter.wipe();
      setActiveInterpreter(null);
    }

    // Parse the script
    const parser = new Parser({
      program: script,
      comments: {
        enabled: comments,
        sequence: commentsSequence,
      },
      splitLines: {
        enabled: splitLines,
        sequence: splitLinesSequence,
      },
    });
    
    let result;
    try {
      result = parser.parse();
    } catch (error) {
      setOutput((prev) => prev + "------------------------" + error + "\n");
      return;
    }

    // Interpret the script
    const interpreter = new Interpreter({
      program: result.instructions,
      events: {
        onInput: () => {
          return parseInt(prompt("Enter a number: ") ?? "0", 10);
        },
        onOutput: (output) => {
          setOutput((prev) => prev + output + "\n");
        },
        onFinished: () => {
          setActiveInterpreter(null);
        },
        onLog(message) {
          setLog((prev) => prev + message + "\n");
        },
      },
      memorySize: memorySize,
    });
    setActiveInterpreter(interpreter);
  };

  // Inject hotkeys
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSettings(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-row items-center justify-between w-full h-16 p-4 bg-gray-100 dark:bg-gray-700 drop-shadow-lg">
        <h1 className="text-2xl font-bold">
          Little Man Computing Interpreter
        </h1>
        <div className="flex flex-row items-center space-x-4">
          {
            comments && !isInvalidSequences() ? (
              <p>
                <code>
                  {commentsSequence}
                </code>
                {" "}resembles a comment.
              </p>
            ) : null
          }
          {
            splitLines && !isInvalidSequences() ? (
              <p>
                <code>
                  {splitLinesSequence}
                </code>
                {" "}resembles a split line.
              </p>
            ) : null
          }
          <p>
            Memory limit of <code>{memorySize}</code> cells.
          </p>
          {
            dump ? (
              <p className="text-orange-500">
                Dump enabled.
              </p>
            ) : null
          }
        </div>
      </header>
      <div className="flex flex-row w-full h-full">
        <div className="w-full h-full p-4 bg-gray-300 dark:bg-gray-900">
          <div className="flex flex-row w-full h-full">
            <textarea
              className="w-full h-full bg-transparent resize-none p-2"
              placeholder="Output will appear here..."
              readOnly
              value={output}
            />
            <textarea
              className="w-full h-full bg-transparent resize-none p-2"
              placeholder="Log will appear here..."
              readOnly
              value={log}
            />
          </div>
        </div>
        <div className="flex flex-col w-[400px] md:w-[600px] lg:w-[800px] h-full bg-gray-400 dark:bg-gray-800 drop-shadow-2xl">  
          <textarea
            className="w-full h-full bg-transparent resize-none p-2"
            placeholder="Enter your LMC code here..."
            onChange={(e) => setScript(e.target.value)}
            value={script}
          />
          <button
            className="w-full bg-gray-500 dark:bg-gray-600 px-3 py-2.5 text-white z-50 cursor-pointer"
            onClick={() => setSettings(true)}
          >
            Open Settings
          </button>
          <button
            className="w-full bg-gray-500 dark:bg-gray-600 px-3 py-2.5 text-white z-50 cursor-pointer"
            onClick={runScript}
          >
            Run Script
          </button>
        </div>
      </div>
      {/* Settings modal */}
      {
        settings ? (  
          <div
            className="flex justify-center items-center fixed w-screen h-screen bg-[rgba(0,0,0,0.2)] z-50"
            onKeyUp={(event) => {
              if (event.key === "Escape") {
                setSettings(false);
              }
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSettings(false);
              }
            }}
          >
            <div className="flex flex-col w-[400px] h-[600px] bg-gray-400 dark:bg-gray-800 drop-shadow-2xl">
              <h2 className="text-2xl font-bold p-4 pb-0">
                Settings
              </h2>
              <div className="flex flex-col p-4 pt-0 h-full gap-2 overflow-y-auto">
                {
                  isInvalidSettings() ? (
                    <div>
                      <p className="text-red-500 font-bold">
                        Invalid settings!
                      </p>
                      {
                        isInvalidSequences() ? (
                          <p className="text-red-500">
                            Pleaste note that neither sequence can start with each other <b>or</b> match. They will be disabled until a valid sequence is provided.
                          </p>
                        ) : null
                      }
                      <p className="text-red-500">
                        Saving settings will not be possible until a valid sequence is provided.
                      </p>
                    </div>
                  ) : null
                }
                <h3 className="text-lg">
                  Comments
                </h3>
                <Checkbox
                  label="Enabled"
                  checked={comments}
                  onChange={setComments}
                />
                {
                  comments ? (
                    <TextBox
                      text={commentsSequence}
                      maxLength={3}
                      onChange={(value) => setCommentsSequence(value.trim())}
                    />
                  ) : null
                }
                {
                  comments && commentsSequence.length === 0 ? (
                    <p className="text-red-500">
                      Comments sequence cannot be empty. They will be disabled until a valid sequence is provided.
                    </p>
                  ) : null
                }
                <h3 className="text-lg">
                  Split lines
                </h3>
                <Checkbox
                  label="Enabled"
                  checked={splitLines}
                  onChange={setSplitLines}
                />
                {
                  splitLines ? (
                    <TextBox
                      text={splitLinesSequence}
                      maxLength={3}
                      onChange={(value) => setSplitLinesSequence(value.trim())}
                    />
                  ) : null
                }
                {
                  splitLines && splitLinesSequence.length === 0 ? (
                    <p className="text-red-500">
                      Split lines sequence cannot be empty. They will be disabled until a valid sequence is provided.
                    </p>
                  ) : null
                }
                <h3 className="text-lg">
                  Memory size
                </h3>
                <input
                  type="number"
                  className="font-mono w-full p-2"
                  value={memorySize}
                  onChange={(e) => setMemorySize(parseInt(e.target.value, 10))}
                />
                <h3 className="text-lg">
                  Dump
                </h3>
                <Checkbox
                  label="Enabled"
                  checked={dump}
                  onChange={setDump}
                />
                <h3 className="text-lg">
                  Step interval
                </h3>
                <input
                  type="number"
                  className="font-mono w-full p-2"
                  value={stepInterval}
                  onChange={(e) => setStepInterval(parseInt(e.target.value, 10))}
                />
                <h3 className="text-lg">
                  Save
                </h3>
                <button
                  className="w-full bg-gray-500 dark:bg-gray-600 px-3 py-2.5 text-white z-50 cursor-pointer"
                  onClick={() => updateSettings()}
                >
                  Save to Local Storage
                </button>
                <button
                  className="w-full bg-gray-500 dark:bg-gray-600 px-3 py-2.5 text-white z-50 cursor-pointer"
                  onClick={() => loadSettings()}
                >
                  Reset to Local Storage
                </button>
                <button
                  className="w-full bg-gray-500 dark:bg-gray-600 px-3 py-2.5 text-white z-50 cursor-pointer"
                  onClick={() => localStorage.clear()}
                >
                  Delete Local Storage
                </button>
              </div>
            </div>
          </div>
        ) : null
      }
    </div>
  );
}
