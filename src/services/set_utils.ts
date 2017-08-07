export function set_intersection(set1: Set<any>, set2: Set<any>) {
    let arr1 = Array.from(set1);
    arr1 = arr1.filter(a => set2.has(a));
    return new Set(arr1);
}

export function set_union(set1: Set<any>, set2: Set<any>) {
    let arr1 = Array.from(set1);
    let arr2 = Array.from(set2);
    arr1 = arr1.concat(arr2);
    return new Set(arr1);

}

export function set_diff(set1: Set<any>, set2: Set<any>) {
    let arr1 = Array.from(set1);
    arr1 = arr1.filter(a => ! set2.has(a));
    return new Set(arr1);
}