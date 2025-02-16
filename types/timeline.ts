export interface PlaylistItem {
    title: string;
    description: string;
    url: string;
  }
  
export interface Section {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    presentation: string;
    playlist?: PlaylistItem[];
  }
  
export interface Timeline {
    id: string;
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    status: string;
    sections: Section[];
  }