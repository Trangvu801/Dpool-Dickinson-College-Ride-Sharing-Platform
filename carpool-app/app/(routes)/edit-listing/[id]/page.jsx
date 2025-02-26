"use client";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Formik } from "formik";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import FileUpload from "../_components/FileUpload";

function EditListing() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id;
  const [listing, setListing] = useState(null); // Set initial state to null

  useEffect(() => {
    if (user && listingId) {
      verifyUserRecord();
    }
  }, [user, listingId]);

  const verifyUserRecord = async () => {
    if (!listingId) return;

    const { data, error } = await supabase
      .from("listing")
      .select("*") // Fetch all fields
      .eq("createdBy", user?.primaryEmailAddress?.emailAddress)
      .eq("id", listingId)
      .single();

    if (data) {
      setListing(data);
    } else {
      router.replace("/");
    }
  };

  const onSubmitHandler = async (formValue) => {
    if (!listingId) return;

    const { error } = await supabase
      .from("listing")
      .update({
        type: formValue.type,
        title: formValue.title,
        date: formValue.date,
        time: formValue.time,
        passenger: formValue.passenger,
        price: formValue.price,
        description: formValue.description,
      })
      .eq("id", listingId);

    if (error) {
      console.error("Error updating listing:", error.message);
    } else {
      toast("Listing updated and published");
    }
    for(const image of images)
    {
      const file=image;
      const fileName=Date.now().toString();
      const fileExt=fileName.split('.').pop();
      const {data,error}=await supabase.storage
      .from('listingImages')
      .upload(`${fileName}`,file,{
        contentType: `image/${fileExt}`,
        upsert:false
      });

      if(error)
      {
        toast('Error while uploading images')
      }
      else {
        console.log('data',data);
      }
    }
  };

  // Prevent rendering form until listing data is loaded
  if (!listing) return null;

  return (
    <div className="px-10 md:px-36 my-10">
      <h2 className="font-bold text-2xl">
        Enter some more detail about your ride
      </h2>
      <Formik
        initialValues={{
          type: listing.type || "",
          title: listing.title || "",
          date: listing.date || new Date().toDateString(),
          time: listing.time || "12:00 PM",
          passenger: listing.passenger || "",
          price: listing.price || "",
          description: listing.description || "",
          profileImage: user?.imageUrl,
          fullName: user?.fullName,
        }}
        onSubmit={onSubmitHandler}
      >
        {({ values, handleChange, handleSubmit, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <div className="p-5 rounded-lg shadow-md grid gap-7 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="flex gap-2 flex-col">
                  <h2 className="text-gray-500">Title</h2>
                  <Textarea
                    placeholder="Enter title"
                    name="title"
                    onChange={handleChange}
                    value={values.title}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-slate-500">
                    Do you want to offer or request a ride?
                  </h2>
                  <RadioGroup
                    defaultValue={values.type}
                    onValueChange={(v) => setFieldValue("type", v)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Request" id="Request" />
                      <Label htmlFor="Request" className="text-lg">
                        Ride Request
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Offer" id="Offer" />
                      <Label htmlFor="Offer" className="text-lg">
                        Ride Offer
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <h2 className="text-gray-500">Date</h2>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-gray-500"
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {values.date}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={
                          values.date ? new Date(values.date) : undefined
                        }
                        onSelect={(date) =>
                          setFieldValue("date", date ? date.toDateString() : "")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <h2 className="text-gray-500">Time</h2>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      className="border rounded-md p-2 pl-10 w-full appearance-none font-normal text-gray-500"
                      name="time"
                      value={values.time}
                      onChange={(e) => setFieldValue("time", e.target.value)}
                    >
                      {[...Array(24)]
                        .map((_, hour) =>
                          [...Array(2)].map((_, min) => {
                            const formattedHour =
                              hour % 12 === 0 ? 12 : hour % 12;
                            const formattedMin = min === 0 ? "00" : "30";
                            const period = hour < 12 ? "AM" : "PM";
                            return (
                              <option
                                key={`${hour}:${formattedMin}`}
                                value={`${formattedHour}:${formattedMin} ${period}`}
                              >
                                {`${formattedHour}:${formattedMin} ${period}`}
                              </option>
                            );
                          })
                        )
                        .flat()}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex gap-2 flex-col">
                  <h2 className="text-gray-500">Passenger</h2>
                  <Input
                    type="number"
                    placeholder="Ex.2"
                    name="passenger"
                    onChange={handleChange}
                    value={values.passenger}
                  />
                </div>
                <div className="flex gap-2 flex-col">
                  <h2 className="text-gray-500">Price per person ($)</h2>
                  <Input
                    type="number"
                    placeholder="Ex.20"
                    name="price"
                    onChange={handleChange}
                    value={values.price}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10">
                <div className="flex gap-2 flex-col">
                  <h2 className="text-gray-500">Description</h2>
                  <Textarea
                    placeholder="Enter details"
                    name="description"
                    onChange={handleChange}
                    value={values.description}
                  />
                </div>
              </div>
              {/* <div>
                <h2 className="font-lg text-gray-500 my-2">Upload Images</h2>
                <FileUpload setImages={(value)=>setImages(value)}/>
              </div> */}
              <div className="flex gap-7 justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  className="text-primary border-green-500"
                >
                  Save
                </Button>
                <Button type="submit">Save & Publish</Button>
              </div>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default EditListing;
