<?php

namespace formulas;

use V8Js;

class JavaScript
{
    protected static V8Js $v8;
    protected static array $v8CompiledStrings = [];

    public static function isAvailable()
    {
        return false; // Пока механизм JS из PHP отключен

        extension_loaded('v8js') || static::isNodeAvailable();
    }

    public static function evaluate(string $js, array $vars)
    {
        if (extension_loaded('v8js')) {
            return static::evaluateWithV8($js, $vars);
        } else {
            return static::evaluateWithNode($js, $vars);
        }
    }

    protected static function evaluateWithV8(string $js, array $vars)
    {
        if (!static::$v8 instanceof V8Js) {
            static::$v8 = new V8Js;
        }

        if (!array_key_exists($js, static::$v8CompiledStrings)) {
            $wrappedJs = <<<JS
                try {
                    with (PHP.vars) {
                        PHP.output.type = 'result';
                        PHP.output.value = (function () { $js })();
                    }
                } catch (e) {
                    PHP.output.type = 'error';
                    PHP.output.message = e.message;
                }
            JS;

            static::$v8CompiledStrings[$js] = static::$v8->compileString($wrappedJs);
        }

        static::$v8->vars = $vars;
        static::$v8->output = new \stdClass;
        static::$v8->executeScript(static::$v8CompiledStrings[$js]);

        if (static::$v8->output->type === 'result') {
            return static::$v8->output->value;
        } elseif (static::$v8->output->type === 'error') {
            throw new \Exception(static::$v8->output->message);
        } else {
            throw new \RuntimeException("Unknown result type");
        }
    }

    protected static $isNodeAvailableCache = null;
    protected static function isNodeAvailable()
    {
        if (static::$isNodeAvailableCache === null) {
            static::$isNodeAvailableCache = strlen(static::runCommand('node -v')['stdout']) > 0;
        }

        return static::$isNodeAvailableCache;
    }

    protected static function evaluateWithNode(string $js, array $vars)
    {
        $encodedVars = json_encode($vars, JSON_THROW_ON_ERROR);

        $wrappedJs = <<<JS
            try {
                with ($encodedVars) {
                    process.stdout.write(JSON.stringify({
                        type: 'result',
                        value: (function () { $js })(),
                    }));
                }
            } catch (e) {
                process.stdout.write(JSON.stringify({
                    type: 'error',
                    message: e.message,
                }));
            }
        JS;

        $cmdResult = static::runCommand('node', $wrappedJs);

        if ($cmdResult['stderr'] === '' && $cmdResult['status']['exitcode'] === 0) {
            $result = json_decode($cmdResult['stdout'], false, 512, JSON_THROW_ON_ERROR);

            if ($result->type === 'result') {
                return $result->value;
            } elseif ($result->type === 'error') {
                throw new \Exception($result->message);
            } else {
                throw new \RuntimeException("Unknown result type");
            }
        }

        $message = "Running nodejs failed.\n";
        $message .= "exit_code={$cmdResult['status']['exitcode']}\n";
        $message .= "stdout={$cmdResult['stdout']}\n";
        $message .= "stderr={$cmdResult['stderr']}\n";
        throw new \RuntimeException($message);
    }

    protected static function runCommand(string $command, string $stdin = null, string $cwd = null, array $envVars = [], array $options = [])
    {
        $descriptors = [
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        if ($stdin !== null) {
            $descriptors[0] = ['pipe', 'r'];
        }

        $proc = proc_open($command, $descriptors, $pipes, $cwd, $envVars, $options);
        if (empty($proc)) {
            throw new \RuntimeException('proc_open() failed');
        }

        if (isset($pipes[0])) {
            fwrite($pipes[0], $stdin);
            fclose($pipes[0]);
        }

        $result = [
            'stdout' => stream_get_contents($pipes[1]),
            'stderr' => stream_get_contents($pipes[2]),
        ];

        while (true) {
            $result['status'] = proc_get_status($proc);
            if ($result['status']['running']) {
                sleep(1);
            } else {
                break;
            }
        }

        $result[0] = &$result['stdout'];
        $result[1] = &$result['stderr'];
        $result[2] = &$result['status'];
        proc_close($proc);

        return $result;
    }
}