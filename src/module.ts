import {BaasDatasource} from "./datasource";
import {BaasDatasourceQueryCtrl} from "./query_ctrl";

class BaasConfigCtrl {
    static templateUrl = 'partials/config.html';
    current: any;

    constructor($scope) {
    }
}

class BaasQueryOptionsCtrl {
    static templateUrl = 'partials/query.options.html';
}

class BaasAnnotationsQueryCtrl {
    static templateUrl = 'partials/annotations.editor.html';
}

export {
    BaasDatasource as DataSource,
    BaasDatasourceQueryCtrl as QueryCtrl,
    BaasConfigCtrl as ConfigCtrl,
    BaasQueryOptionsCtrl as QueryOptionsCtrl,
    BaasAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
