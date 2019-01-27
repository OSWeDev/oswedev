import IVarDataParamVOBase from './IVarDataParamVOBase';
import IDistantVOBase from '../../IDistantVOBase';
import IVarDataValueBase from './IVarDataValueBase';

/**
 * N'a pas vocation a être stocké en base a priori, c'est la classe qui va gérer la data calculée dynamiquement
 */
export default interface IVarDataVOBase extends IDistantVOBase, IVarDataParamVOBase, IVarDataValueBase {

    typesInfo: number[];
}