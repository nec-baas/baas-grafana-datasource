import {BaasDatasource} from "./datasource";
import {BaasDatasourceQueryCtrl} from "./query_ctrl";

class BaasConfigCtrl {
    static templateUrl = 'partials/config.html';
}

class BaasQueryOptionsCtrl {
    static templateUrl = 'partials/query.options.html';
}

export {
    BaasDatasource as DataSource,
    BaasDatasourceQueryCtrl as QueryCtrl,
    BaasConfigCtrl as ConfigCtrl,
    BaasQueryOptionsCtrl as QueryOptionsCtrl
};
