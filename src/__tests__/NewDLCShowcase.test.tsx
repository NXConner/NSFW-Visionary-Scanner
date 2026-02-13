import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import NewDLCShowcase from "@/pages/NewDLCShowcase";

const mockNavigate = vi.fn();

const mockPackages = [
  {
    id: "p1",
    packageId: "dlc-nsfw-scanner",
    packageName: "NSFW Scanner Mode",
    packageType: "individual",
    safeDescription: "Adult-only scanning mode",
    fullDescription: "Details",
    marketingTagline: "Scanner",
    priceUsd: 6.99,
    priceType: "one_time",
    features: [
      { id: "nsfw_scanner_mode", name: "Scanner", description: "x", category: "advanced" },
    ],
    version: "1.0.0",
    contentVersion: "2025.12.27",
    minAppVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 1,
    contentRating: "18+",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p2",
    packageId: "dlc-topics-library",
    packageName: "Topics Library",
    packageType: "individual",
    safeDescription: "Topics library",
    fullDescription: "Details",
    marketingTagline: "Topics",
    priceUsd: 2.99,
    priceType: "one_time",
    features: [
      { id: "topics_library", name: "Topics Library", description: "x", category: "topics" },
    ],
    version: "1.0.0",
    contentVersion: "2025.12.27",
    minAppVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 2,
    contentRating: "18+",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p3",
    packageId: "dlc-community",
    packageName: "Private Community",
    packageType: "individual",
    safeDescription: "Private community",
    fullDescription: "Details",
    marketingTagline: "Community",
    priceUsd: 9.99,
    priceType: "one_time",
    features: [{ id: "private_forum", name: "Forum", description: "x", category: "community" }],
    version: "1.0.0",
    contentVersion: "2025.12.27",
    minAppVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 3,
    contentRating: "18+",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/dlc/core/DLCRegistry", () => {
  return {
    dlcRegistry: {
      getAllPackages: () => mockPackages,
    },
  };
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <NewDLCShowcase />
    </BrowserRouter>,
  );
};

describe("NewDLCShowcase", () => {
  it("should render the page title", () => {
    renderComponent();
    expect(screen.getByText("NSFW Add-Ons Showcase")).toBeInTheDocument();
  });

  it("should display NSFW add-on packages", () => {
    renderComponent();
    expect(screen.getByText("NSFW Scanner Mode")).toBeInTheDocument();
    expect(screen.getAllByText("Topics Library").length).toBeGreaterThan(0);
    expect(screen.getByText("Private Community")).toBeInTheDocument();
  });

  it("should display category tabs", () => {
    renderComponent();
    expect(screen.getByRole("tab", { name: /All NSFW Add-Ons/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Scanner/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Topics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Community/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Analytics/i })).toBeInTheDocument();
  });

  it("should filter packages by category when tab is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("tab", { name: /Topics/i }));
    expect(screen.getAllByText("Topics Library").length).toBeGreaterThan(0);
  });

  it("should navigate to store when Open in Store is clicked", () => {
    renderComponent();
    const openButtons = screen.getAllByRole("button", { name: /Open in Store/i });
    fireEvent.click(openButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/store\?package=/));
  });

  it("should display call to action section", () => {
    renderComponent();
    expect(screen.getByText("Ready to unlock premium features?")).toBeInTheDocument();
  });

  it("should include CTA navigation buttons", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: /Open DLC Store/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /NSFW Add-ons Landing/i })).toBeInTheDocument();
  });
});
