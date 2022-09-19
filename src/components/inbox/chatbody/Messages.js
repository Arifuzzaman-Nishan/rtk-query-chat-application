import { useEffect, useRef, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { messagesApi } from "../../../features/messages/messagesApi";
import Message from "./Message";

export default function Messages({ messages = [],totalCount }) {
    const messagesEndRef = useRef(null)
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth) || {};
    const { email } = user || {};
    const { id } = useParams();

    const [page,setPage] = useState(1);
    const [hasMore,setHasMore] = useState(true);

    const fetchMore = () => {
        console.log("fetch more...");
        setPage(prev => prev+1);
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollTo({top: window.innerHeight-197, 
            behavior: 'smooth'})
      }
    
      useEffect(() => {
        scrollToBottom();
        setPage(1);
      },[id]);

    useEffect(() => {
        if(page > 1){
           dispatch(
                messagesApi.endpoints.getMoreMessages.initiate({
                    id,
                    page
                },{forceRefetch:true})
           ) 
        }
    },[dispatch, page])

    useEffect(() => {
        if(totalCount > 0){
            const more =
                Math.ceil(
                    totalCount /
                        Number(process.env.REACT_APP_MESSAGES_PER_PAGE)
                ) > page;
            setHasMore(more);
        }
    },[totalCount,page])

    
    return (
        <div id="scrollableDiv" className="relative w-full h-[calc(100vh_-_197px)] p-6 overflow-y-auto flex flex-col-reverse" ref={messagesEndRef}>

            <InfiniteScroll
                dataLength={messages.length}
                next={fetchMore}
                style={{display:'flex',flexDirection:'column-reverse'}}
                inverse={true}
                hasMore={hasMore}
                loader={<h4>Loading...</h4>}
                scrollableTarget="scrollableDiv"
            >
                <ul className="space-y-2">
                    {messages
                        .slice()
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map((message) => {
                            const {
                                message: lastMessage,
                                id,
                                sender,
                            } = message || {};

                            const justify =
                                sender.email !== email ? "start" : "end";

                            return (
                                <Message
                                    key={id}
                                    justify={justify}
                                    message={lastMessage}
                                />
                            );
                        })}
                </ul>

            </InfiniteScroll>
        </div>

    );
}
