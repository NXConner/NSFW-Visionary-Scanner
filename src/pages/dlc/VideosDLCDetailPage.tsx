import React from "react";
import { useParams } from "react-router-dom";
import VideosDLCPage from "./VideosDLCPage";

export default function VideosDLCDetailPage(): React.ReactElement {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;
  return <VideosDLCPage initialVideoId={id} />;
}
