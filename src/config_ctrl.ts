export class BaasConfigCtrl {
    static templateUrl = 'partials/config.html';
    current: any;

    constructor($scope) {
        this.current.jsonData.tenantId = this.current.jsonData.tenantId || "";
        this.current.jsonData.appId = this.current.jsonData.appId || "";
        this.current.jsonData.appKey = this.current.jsonData.appKey || "";
    }
}
