# MU Web Audio Tester

Сборка под Wasm
===============


Среда сборки
------------

1. Скачать и настроить [emsdk](https://emscripten.org/docs/getting_started/downloads.html) 
2. Добавить переменную окружения EMSDK_PATH с путём до emsdk
3. Скачать и установить cmake, добавить путь до него в PATH
4. Установить Node и npm
5. Установить `sudo npm install -g http-server`
6. Исходники MuseScore должны быть в папке `MuseScore` на одном уровне с папкой этого проекта
7. Выполнить `run_cmake_all.sh`
8. Выполнить `run_build_all.sh`
9. Выполнить `run_server.sh` (лучше в отдельной вкладке терминала)
10. Открыть браузер (лучше Хроме) по адресу `localhost:8081`

Интеграция с QtCreator
----------------------

1. Выполнить `run_cmake_all.sh`
2. Открыть в QtCreator `main/CMakeLists.txt` Выбрать только Imported Kit и конфигурацию Build. Нажать Configure Project
3. В QtCreator открыть меню Tools/Options/Kits, выбрать Imported Kit: 
  1. Name: EMSCRIPTEN (переименовать)
  2. Compiler: какой нибуть
  3. Debuger: none
  4. Qt version: none
  5. CMake Tool: path/to/cmake.exe
  6. CMake generator: <none> - Unix Makefiles, Platform: <none>, Toolset: <none>
  7. CMake Configuration: оставить то, что есть
  8. Нажать Ок, в диалоге об изменении конфигурации выбрать "Apply Changes to Project"
5. Запустить сборку (кликнуть на зелёный треугольник) - должно собраться, запуститься - это проверка сборки С++ кода, для проверки в браузере лучше вызвать `run_build_all.sh`