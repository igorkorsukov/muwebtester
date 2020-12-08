#ifndef LOG_H
#define LOG_H

#include <stdio.h>
#include <sstream>
#include <iostream>

struct Log {
    std::stringstream ss;
    ~Log() {
        printf("%s\n", ss.str().c_str());
    }
};

#define LOG() Log().ss
#define LOGI() Log().ss
#define LOGE() Log().ss

#define IF_ASSERT_FAILED(p) if (!p)
#define UNUSED(v)

#endif // LOG_H
