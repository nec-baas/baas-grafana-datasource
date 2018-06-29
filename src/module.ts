import {BaasDatasource} from "./datasource";
import {BaasDatasourceQueryCtrl} from "./query_ctrl";
import {BaasConfigCtrl} from "./config_ctrl";

class BaasQueryOptionsCtrl {
    static templateUrl = 'partials/query.options.html';
}

class BaasAnnotationsQueryCtrl {
    static templateUrl = 'partials/annotations.editor.html';
}

export {
    BaasDatasource as Datasource,
    BaasDatasourceQueryCtrl as QueryCtrl,
    BaasConfigCtrl as ConfigCtrl,
    BaasQueryOptionsCtrl as QueryOptionsCtrl,
    BaasAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
