import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import type { LearningCourse } from "@/lib/interactiveLearning";
import type { Certificate } from "../types";

export function CertificatesTab({
  loading,
  certificates,
  courses,
}: {
  loading: boolean;
  certificates: Certificate[];
  courses: LearningCourse[];
}): JSX.Element {
  return loading ? (
    <div className="text-center py-12 text-muted-foreground">Loading...</div>
  ) : certificates.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {certificates.map(cert => {
        const course = courses.find(c => c.id === cert.course_id);
        return (
          <Card key={cert.id} variant="glass">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6 text-yellow-500" />
                <CardTitle>Certificate of Completion</CardTitle>
              </div>
              <CardDescription>{course?.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Certificate Number: {cert.certificate_number}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "—"}
              </p>
              {cert.pdf_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer">
                    Download Certificate
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-12 text-muted-foreground">
      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No certificates yet. Complete courses to earn certificates!</p>
    </div>
  );
}
