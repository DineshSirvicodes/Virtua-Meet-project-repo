'use client';
import { useRouter } from 'next/navigation';
import { useState } from "react"
import HomeCard from "./HomeCard"
import MeetingModal from './MeetingModal';
import { useUser } from '@clerk/nextjs';
import Loader from './Loader';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

import { useToast } from "@/components/ui/use-toast"
import { Textarea } from './ui/textarea';
import ReactDatePicker from "react-datepicker";
import { Input } from './ui/input';

const MeetingTypeList = () => {

  const router = useRouter();
  const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting'
  | 'isInstantMeeting' | undefined >(undefined);

  const { user } = useUser();
  const client = useStreamVideoClient();
  const [values,setValues] = useState({
    dateTime : new Date(),
    description : '',
    link : ''
  })
  const [callDetails, setCallDetails] = useState<Call>()

  const { toast } = useToast();

  const createMeeting = async () => {
    if(!client || !user ) return;

    try{
        if(!values.dateTime){
            toast({
                title: "Please select a date and time"
            })
            return;
        }

        const id = crypto.randomUUID(); // creates random id
        const call = client.call('default',id);
        if(!call) throw new Error('Failed to create the call')

        const startsAt = values.dateTime.toISOString() || 
        new Date(Date.now()).toISOString();
        const description = values.description || 'Instant Meeting';

        await call.getOrCreate({
            data : {
                starts_at : startsAt,
                custom : {
                    description,
                },
            },
        });
        setCallDetails(call);

        if(!values.description){
            router.push(`/meeting/${call.id}`);
        }
        toast({
            title: "Meeting created",
        })
    } catch(error){
        console.log(error);
        toast({
            title: "Failed to create a meeting",
        })
    } 
  }
  if(!client || !user ) return <Loader />
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <HomeCard 
            img="/icons/add-meeting.svg"
            title="New Meet"
            description="Create an instant meeting"
            handleClick={() => setMeetingState('isInstantMeeting')}
            className="bg-orange-1"
        />
        <HomeCard
            img="/icons/join-meeting.svg"
            title="Join a Meet"
            description="via an invitation link"
            handleClick={() => setMeetingState('isJoiningMeeting')}
            className="bg-blue-1"
        />

        <HomeCard 
            img="/icons/schedule.svg"
            title="Schedule a Meet"
            description="Plan your Meeting"
            handleClick={() => setMeetingState('isScheduleMeeting')}
            className="bg-purple-1"
        />
        <HomeCard 
            img="/icons/recordings.svg"
            title="View Recordings"
            description="Check out your saved Recordings"
            handleClick={() => router.push('/recordings')}
            className="bg-yellow-1"
        />
        {!callDetails ? (
            <MeetingModal 
            isOpen={meetingState === 'isScheduleMeeting'}
            onClose={() => setMeetingState(undefined)}
            title="Create Meeting"
            handleClick={createMeeting}
            >
            <div className="flex flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">Add a description</label>
                <Textarea className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                onChange={(e) => {
                    setValues({...values,description : e.target.value})
                }}/>
            </div>
            <div className="flex w-full flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">
                    Select Date and Time
                </label>
                <ReactDatePicker 
                    selected={values.dateTime}
                    onChange={(date) => setValues({...values, dateTime : date!})}
                    showTimeSelect
                    timeFormat='HH:mm'
                    timeIntervals={15}
                    timeCaption='time'
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full rounded bg-dark-3 p-2 focus:outline-none"
                />
            </div>
            </MeetingModal>
        ) : (
            <MeetingModal
                isOpen={meetingState === 'isScheduleMeeting'}
                onClose={() => setMeetingState(undefined)}
                title="Meeting Created"
                className ="text-center"
                handleClick={() => {
                    navigator.clipboard.writeText(meetingLink);
                    toast({title : 'Link Copied'})
                }}
                image="/icons/checked.svg"
                buttonIcon="/icons/copy.svg"
                buttonText="Copy Meeting Link"
            />
        )}

        <MeetingModal
            isOpen={meetingState === 'isInstantMeeting'}
            onClose={() => setMeetingState(undefined)}
            title="Start an Instant Meeting"
            className ="text-center"
            buttonText="Start Meeting"
            handleClick={createMeeting}

        />
        <MeetingModal
            isOpen={meetingState === 'isJoiningMeeting'}
            onClose={() => setMeetingState(undefined)}
            title="Type the link here"
            className="text-center"
            buttonText="Join Meeting"
            handleClick={() => router.push(values.link)}
        >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

    </section>
  )
}

export default MeetingTypeList