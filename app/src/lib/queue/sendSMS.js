// import Redis from "ioredis";
import bulkSMS from ".";

// interface Props {
//     phone: string
//     fullname: string
//     message: string
// }

const smsSend = async (props) => {
    const data = {
        data: {
            participant_phone: props.phone,
            participant_full_name: props.fullname,
            message: props.message,
            type: "single"
        }
    }
    await bulkSMS.add(data);
}

// const redis = new Redis(process.env.REDIS_URL || 'redis://41.243.25.144:6379');

// export async function enqueueSms(props) {
//   await redis.lpush('bulksms', JSON.stringify(props));
// }

export default smsSend;