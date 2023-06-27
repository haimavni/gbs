
export class SpyValueConverter {
    toView(array, agent) {
        agent.size = array.length;
        return array;
    }
}
