import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IMatroid from '../../Matroid/interfaces/IMatroid';

export default class APIDAOApiTypeAndMatroidsParamsVO implements IAPIParamTranslator<APIDAOApiTypeAndMatroidsParamsVO>{

    public static fromParams(
        API_TYPE_ID: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string }): APIDAOApiTypeAndMatroidsParamsVO {

        return new APIDAOApiTypeAndMatroidsParamsVO(API_TYPE_ID, matroids, fields_ids_mapper);
    }

    public constructor(
        public API_TYPE_ID: string,
        public matroids: IMatroid[],
        public fields_ids_mapper: { [matroid_field_id: string]: string }) {
    }

    public getAPIParams(): any[] {
        return [this.API_TYPE_ID, this.matroids, this.fields_ids_mapper];
    }
}

export const APIDAOApiTypeAndMatroidsParamsVOStatic: IAPIParamTranslatorStatic<APIDAOApiTypeAndMatroidsParamsVO> = APIDAOApiTypeAndMatroidsParamsVO;