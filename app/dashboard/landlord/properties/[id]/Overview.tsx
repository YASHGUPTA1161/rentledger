interface OverviewProps {
  propertyId: string;
}

export function Overview({ propertyId }: OverviewProps) {
  return (
    <div>
      <h2>Overview</h2>
      <p>Property ID: {propertyId}</p>
      {/* Add your overview content here */}
    </div>
  );
}
