/**
 * 节点数据结构
 * @id: 节点id
 * @url: 节点url
 */
const state = {
    id: 0,
    url: ""
}

export const NodeAction = {
    generate: (id, url) => {
        state.id = id;
        state.url = url;
        return { ...state }
    }
}