// import Blank from "./Blank";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useGetMessagesQuery } from "../../../features/messages/messagesApi";
import Error from "../../ui/Error";
import ChatHead from "./ChatHead";
import Messages from "./Messages";
import Options from "./Options";

export default function ChatBody() {
    const { id } = useParams();
    const {user} = useSelector(state => state.auth);

    const {
        data,
        isLoading,
        isError,
        error,
    } = useGetMessagesQuery({id,email: user?.email});

    // decide what to render
    let content = null;

    if (isLoading) {
        content = <div>Loading...</div>;
    } else if (!isLoading && isError) {
        content = (
            <div>
                <Error message={error?.data} />
            </div>
        );
    } else if (!isLoading && !isError && data?.messages?.length === 0) {
        content = <div>No messages found!</div>;
    } else if (!isLoading && !isError && data?.messages?.length > 0) {
        content = (
            <>
                <ChatHead message={data?.messages[0]} />
                <Messages messages={data?.messages} totalCount={data?.totalCount}/>
                <Options info={data?.messages[0]} />
            </>
        );
    }

    return (
        <div className="w-full lg:col-span-2 lg:block">
            <div className="w-full grid conversation-row-grid">{content}</div>
        </div>
    );
}
