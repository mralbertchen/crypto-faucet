const axios = require("axios");

const localTestRpcEndpoint = "";
const defaultHeaders       = {
  'Content-Type': 'application/json'
};

module.exports = ({
  url = localTestRpcEndpoint,
  auth = {}
}) => {

  const doCall = async ({
    payload = {},
    headers = defaultHeaders
  }) => {
    try {
      const { data } = await axios.post(url, payload, {
        'Content-Length': JSON.stringify(payload).length,
        auth:             auth === {} ? null : auth,
        ...headers
      });
      // console.log(`#doCall 1 data ${JSON.stringify(data, null, 2)}`);

      if (data.id !== payload.id) {
        const error = {
          isInternal: true,
          name:       `invalid_rpc_response`,
          message:    `rpc response object id does not match payload id`,
          context:    { url, auth, payload, headers },
          location:   { filename: __filename, function: `#doCall` }
        };

        console.error(`#doCall id mismatch ${JSON.stringify(error, null, 2)}`);
        return Promise.reject(error);
      }

      console.info(`RPC Request ${payload.method} on ${data.id} completed ${Date.now()} Time taken: ${Date.now() - data.id} ms`);
      console.info(`RPC Returns: ${JSON.stringify(data.result)}`);
      return data.result;
    } catch (err) {
      const error = {
        isInternal: true,
        name:       `rpc_error`,
        message:    `unable to successfully post to RPC`,
        context:    { url, auth, payload, headers },
        inner:      err.isInternal ? err : { name: err.name, message: err.message },
        location:   { filename: __filename, function: `#doCall` }
      };
      console.error(`#doCall error ${JSON.stringify(error, null, 2)}`);
      return Promise.reject(error);
    }
  };

  return {
    async callRPC({
      payload = {},
      headers = defaultHeaders
    }) {
      try {
        const result = await doCall({ payload, headers });


        return result;
      } catch (err) {
        return Promise.reject(err);
      }
    },


    /**
     * @param url
     * @param payloads
     * @param headers
     * @returns {Promise.<*>}
     */
    async callRPCBatch({
      payloads = [],
      headers = defaultHeaders,
      submitTime = Date.now()
    }) {
      try {
        const { data } = await axios.post(url, payloads, {
          'Content-Length': JSON.stringify(payloads).length,
          auth:             auth === {} ? null : auth,
          ...headers
        });

        // Handle missing result objects.  Order should match payload order, so iterate sequentially to match.
        const payloadsWithoutResponse = [];

        let payloadIndex = 0;
        let datumIndex   = 0;

        while (payloadIndex < payloads.length && datumIndex < data.length) {
          // If the ids aren't equal, keep iterating payloads.  There should never be more data objects than payload
          // objects - this would indicate a serious RPC with the node (unlikely).
          while (data[ datumIndex ].id !== payloads[ payloadIndex ].id) {
            payloadsWithoutResponse.push(payload);

            payloadIndex++;
          }

          payloadIndex++;
          datumIndex++;
        }

        console.info(`Batch RPC ${payloads.length} Requests
        Time taken: ${Date.now() - submitTime} ms`);

        const returnData = data.map(({ result }) => result);

        return returnData;
        // .map(datum => datum.result);
      } catch (err) {
        if (err.isInternal) console.error(JSON.stringify(err, null, 2));
        return Promise.reject(err);
      }
    }
  };
};
