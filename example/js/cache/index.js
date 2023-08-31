function createRequestCache() {
    const cacheStack = new Map();

    return async function requestWithCache(type, requestParams) {
        const cacheKey = JSON.stringify({ type, requestParams });

        if (cacheStack.has(cacheKey)) {
            console.log('Using cached result for:', cacheKey);
            return cacheStack.get(cacheKey);
        }

        const result = await makeAjaxRequest(type, requestParams);
        cacheStack.set(cacheKey, result);
        return result;
    };
}

// 使用示例
const cachedRequest = createRequestCache();

// 第一次请求，会触发实际的AJAX请求，并将结果缓存起来
cachedRequest('getData', { param1: 'value1' }).then(result => console.log(result));

// 第二次请求，直接从缓存中获取结果，而不再发起AJAX请求
cachedRequest('getData', { param1: 'value1' }).then(result => console.log(result));
