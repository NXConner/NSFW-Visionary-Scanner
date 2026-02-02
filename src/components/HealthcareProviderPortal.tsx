/**
 * Healthcare Provider Portal
 * Professional portal for healthcare providers with patient data access, reporting, treatment planning, and HIPAA compliance
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getHealthcareProvider,
  createHealthcareProvider,
  getPatientRelationships,
  grantProviderAccess,
  createProfessionalReport,
  createTreatmentPlan,
  type HealthcareProvider,
  type PatientProviderRelationship,
  type ProviderProfessionalReport,
  type TreatmentPlan,
} from "@/lib/healthcareProviderPortal";
import {
  Stethoscope,
  Users,
  FileText,
  Calendar,
  Shield,
  Loader2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SUPPORT_CONTACT_EMAIL } from "@/config/brand";

export const HealthcareProviderPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<HealthcareProvider | null>(null);
  const [relationships, setRelationships] = useState<PatientProviderRelationship[]>([]);
  const [showProviderForm, setShowProviderForm] = useState(false);

  const [providerForm, setProviderForm] = useState({
    provider_name: "",
    provider_type: "doctor" as "doctor" | "clinic" | "hospital" | "organization",
    specialty: [] as string[],
    email: "",
    phone: "",
    license_number: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providerData, relationshipsData] = await Promise.all([
        getHealthcareProvider(),
        getPatientRelationships(),
      ]);
      setProvider(providerData);
      setRelationships(relationshipsData);
      if (providerData) {
        setShowProviderForm(false);
      } else {
        setShowProviderForm(true);
      }
    } catch (error) {
      toast.error("Failed to load provider data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    try {
      const newProvider = await createHealthcareProvider(providerForm);
      if (newProvider) {
        setProvider(newProvider);
        setShowProviderForm(false);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to create provider profile");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading provider portal...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!provider && showProviderForm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6" />
              Create Provider Profile
            </CardTitle>
            <CardDescription>
              Set up your healthcare provider profile to access the provider portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Provider Name</Label>
              <Input
                value={providerForm.provider_name}
                onChange={e => setProviderForm({ ...providerForm, provider_name: e.target.value })}
                placeholder="Dr. John Smith"
              />
            </div>
            <div>
              <Label>Provider Type</Label>
              <select
                className="w-full p-2 border rounded"
                value={providerForm.provider_type}
                onChange={e =>
                  setProviderForm({
                    ...providerForm,
                    provider_type: e.target.value as typeof providerForm.provider_type,
                  })
                }
              >
                <option value="doctor">Doctor</option>
                <option value="clinic">Clinic</option>
                <option value="hospital">Hospital</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={providerForm.email}
                onChange={e => setProviderForm({ ...providerForm, email: e.target.value })}
                placeholder={SUPPORT_CONTACT_EMAIL}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={providerForm.phone}
                onChange={e => setProviderForm({ ...providerForm, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label>License Number</Label>
              <Input
                value={providerForm.license_number}
                onChange={e => setProviderForm({ ...providerForm, license_number: e.target.value })}
                placeholder="License number"
              />
            </div>
            <Button onClick={handleCreateProvider} className="w-full">
              Create Provider Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-6 h-6" />
                Healthcare Provider Portal
              </CardTitle>
              <CardDescription>
                {provider.provider_name} - {provider.provider_type}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {provider.hipaa_compliant && (
                <Badge variant="default">
                  <Shield className="w-4 h-4 mr-1" />
                  HIPAA Compliant
                </Badge>
              )}
              <Badge variant={provider.subscription_status === "active" ? "default" : "secondary"}>
                {provider.subscription_status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{provider.current_patient_count}</div>
                    <div className="text-sm text-muted-foreground">Active Patients</div>
                  </CardContent>
                </Card>
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{provider.max_patients}</div>
                    <div className="text-sm text-muted-foreground">Max Patients</div>
                  </CardContent>
                </Card>
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{provider.subscription_tier}</div>
                    <div className="text-sm text-muted-foreground">Subscription Tier</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="patients" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Patient Relationships</h3>
              </div>
              {relationships.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No patient relationships yet
                </div>
              ) : (
                <div className="space-y-2">
                  {relationships.map(relationship => (
                    <Card key={relationship.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              Patient ID: {relationship.patient_id.substring(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {relationship.relationship_type} • {relationship.access_level}
                            </p>
                          </div>
                          <Badge
                            variant={relationship.status === "active" ? "default" : "secondary"}
                          >
                            {relationship.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Professional Reports</h3>
                <Button
                  size="sm"
                  onClick={() => toast.info("Select a patient first to create a report")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Report
                </Button>
              </div>
              {relationships.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports yet</p>
                  <p className="text-sm mt-2">
                    Connect with patients to create professional reports
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select a patient from the Patients tab to view or create reports
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="treatment-plans" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Treatment Plans</h3>
                <Button
                  size="sm"
                  onClick={() => toast.info("Select a patient first to create a treatment plan")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Button>
              </div>
              {relationships.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No treatment plans yet</p>
                  <p className="text-sm mt-2">Connect with patients to create treatment plans</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select a patient from the Patients tab to manage treatment plans
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Provider Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Provider Name</Label>
                    <Input value={provider.provider_name} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={provider.email} disabled />
                  </div>
                  <div>
                    <Label>Subscription Tier</Label>
                    <Input value={provider.subscription_tier} disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
