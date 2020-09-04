
export interface glueMeta {
    name?: string,
    desc?: string,
    misc?: any,
    controller?: any,
    contrain?: any
}

export declare function glueObject<T>(o: T, prefix?: string): T

export declare function glueEvent(meta?: glueMeta): ((data?) => any) | { on: () => any };
export declare function glueValue<T>(v: T, meta?: glueMeta): T;
export declare function glueAction<T>(v: T, meta?: glueMeta): T;

export declare function glued<T>(v: T): T; //in = out
