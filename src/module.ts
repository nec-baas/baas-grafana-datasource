import {BaasDatasource} from "./baas_datasource";
import {BaasDatasourceQueryCtrl} from "./query_ctrl";

class BaasConfigCtrl {}
BaasConfigCtrl.templatUrl = 'partials/config.html';

export {
    BaasDatasource as DataSource,
    BaasDatasourceQueryCtrl as QueryCtrl,
    BaasConfigCtrl as ConfigCtrl
};
