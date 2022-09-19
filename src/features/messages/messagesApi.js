import io from "socket.io-client";
import { apiSlice } from "../api/apiSlice";

export const messagesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMessages: builder.query({
            query: ({id,email}) =>
                `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
                transformResponse(apiResponse, meta){
                    const totalCount = meta.response.headers.get("X-Total-Count");
                    return {
                        messages: apiResponse,
                        totalCount,
                    };
                },
                async onCacheEntryAdded(
                    arg,{updateCachedData,cacheDataLoaded,cacheEntryRemoved}
                ){
                    // create socket
                    const socket = io(process.env.REACT_APP_API_URL, {
                        reconnectionDelay: 1000,
                        reconnection: true,
                        reconnectionAttemps: 10,
                        transports: ["websocket"],
                        agent: false,
                        upgrade: false,
                        rejectUnauthorized: false,
                    });

                    try {
                        await cacheDataLoaded;
                        socket.on("message",(data) => {
                            const{sender,receiver} = data?.data;

                            if((arg?.email === sender?.email) || (arg?.email === receiver?.email)){
                                updateCachedData((draft) => {
                                    const message = draft.messages.find(
                                        m => m.conversationId == data?.data?.conversationId
                                    )
                                    message.message = data?.data?.message;
                                    message.timestamp = data?.data?.timestamp;
                                    // console.log("message cached data",JSON.stringify(draft));
                                    // draft.messages.push(data?.data);
                                })
                            }

                        })
                    } catch (err) {}

                    await cacheEntryRemoved;
                    socket.close();
                }
        }),
        getMoreMessages: builder.query({
            query:({id,page}) => 
            `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
            async onQueryStarted({id},{queryFulfilled,dispatch}){
                try {
                    const messages = await queryFulfilled;
                    if(messages?.data?.length > 0){
                        dispatch(
                            apiSlice.util.updateQueryData(
                                "getMessages",
                                id.toString(),
                                (draft) => {
                                    return {
                                        messages:[
                                            ...draft.messages,
                                            ...messages?.data
                                        ],
                                        totalCount: Number(draft.totalCount)
                                    }
                                }
                            )
                        )
                    }

                } catch (err) {
                    console.log(err.message);
                }
            }
        }),
        addMessage: builder.mutation({
            query: (data) => ({
                url: "/messages",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const { useGetMessagesQuery, useAddMessageMutation,useGetMoreMessagesQuery } = messagesApi;
