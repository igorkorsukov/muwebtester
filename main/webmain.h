#ifndef MU_WEBMAIN_H
#define MU_WEBMAIN_H

#include <string>

namespace mu::web {

    int init(bool verbose);
    void update();

    void action(const std::string& action);
}

#endif // MU_WEBMAIN_H
