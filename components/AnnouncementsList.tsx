"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { MessageSquare, Calendar, ChevronRight } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  createdBy: string
  createdAt: any
}

interface AnnouncementsListProps {
  maxItems?: number
  showViewAll?: boolean
}

export default function AnnouncementsList({ maxItems = 5, showViewAll = true }: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const announcementsRef = collection(db, "announcements")
      const q = query(announcementsRef, orderBy("createdAt", "desc"), limit(maxItems))
      const querySnapshot = await getDocs(q)

      const announcementsData: Announcement[] = []
      querySnapshot.forEach((doc) => {
        announcementsData.push({
          id: doc.id,
          ...doc.data(),
        } as Announcement)
      })

      setAnnouncements(announcementsData)
    } catch (error) {
      console.error("Error fetching announcements:", error)
      // Fallback without orderBy if index doesn't exist
      try {
        const announcementsRef = collection(db, "announcements")
        const querySnapshot = await getDocs(announcementsRef)
        const announcementsData: Announcement[] = []
        querySnapshot.forEach((doc) => {
          announcementsData.push({
            id: doc.id,
            ...doc.data(),
          } as Announcement)
        })
        setAnnouncements(announcementsData.slice(0, maxItems))
      } catch (fallbackError) {
        console.error("Fallback announcements fetch failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
      case "important":
        return <Badge className="bg-orange-100 text-orange-800">Important</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "urgent":
        return "border-l-red-500"
      case "important":
        return "border-l-orange-500"
      default:
        return "border-l-blue-500"
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MessageSquare className="mr-2 h-5 w-5 text-blue-900" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading announcements...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <MessageSquare className="mr-2 h-5 w-5 text-blue-900" />
              Announcements
            </CardTitle>
            <CardDescription>Latest updates and important information</CardDescription>
          </div>
          {showViewAll && announcements.length > 0 && (
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 border-l-4 bg-gray-50 rounded-r-lg ${getTypeColor(announcement.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 line-clamp-1">{announcement.title}</h4>
                  {getTypeBadge(announcement.type)}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{announcement.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By {announcement.createdBy}</span>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {announcement.createdAt?.toDate?.()?.toLocaleDateString() || "Recent"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No announcements</h3>
            <p className="text-gray-500">Check back later for updates and important information.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
