export declare function glueObject<T>(o: T, prefix?: string): T

export declare function glueEvent(): ((data?) => any) | { on: () => any };
export declare function glueValue<T>(v: T): T;
export declare function glueAction<T>(v: T): T;


export declare function glued<T>(v: T) : T; //in = out