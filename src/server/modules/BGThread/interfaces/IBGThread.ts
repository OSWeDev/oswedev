export default interface IBGThread {

    name: string;

    /**
     * WARNING: Each thread runs with full memory load. Use only for very demanding execs than would dramatically block the other bgthreads or crons otherwise.
     */
    exec_in_dedicated_thread?: boolean;

    /**
     * Timeout before BGT first launch (see ModuleBGThreadServer.DEFAULT_initial_timeout for example)
     */
    current_timeout: number;

    /**
     * Max timeout possible for this BGT (see ModuleBGThreadServer.DEFAULT_MAX_timeout for example)
     */
    MAX_timeout: number;

    /**
     * Min timeout possible for this BGT (see ModuleBGThreadServer.DEFAULT_MIN_timeout for example)
     */
    MIN_timeout: number;

    /**
     * Returns coef to apply to current timeout (see ModuleBGThreadServer.TIMEOUT_COEF_FASTER for example)
     */
    work(): Promise<number>;
}