export default class DataFilterOption {
    public static STATE_SELECTED: number = 1;
    public static STATE_SELECTABLE: number = 2;
    public static STATE_UNSELECTABLE: number = 3;

    public constructor(
        public select_state: number,
        public label: string,
        public id: number,
        public disabled_state_selected: boolean = false,
        public disabled_state_selectable: boolean = false,
        public disabled_state_unselectable: boolean = false,
    ) { }
}