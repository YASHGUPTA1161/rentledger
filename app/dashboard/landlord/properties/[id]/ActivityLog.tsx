interface ActivityLogProps {
  propertyId: string;
}

export function ActivityLog({ propertyId }: ActivityLogProps) {
  return (
    <div>
      <h2>Activity Log</h2>
      <p>Property ID: {propertyId}</p>
      {/* Add your activity log content here */}
    </div>
  );
}
