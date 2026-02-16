interface MaintenanceProps {
  propertyId: string;
}

export function Maintenance({ propertyId }: MaintenanceProps) {
  return (
    <div>
      <h2>Maintenance</h2>
      <p>Property ID: {propertyId}</p>
      {/* Add your maintenance content here */}
    </div>
  );
}
