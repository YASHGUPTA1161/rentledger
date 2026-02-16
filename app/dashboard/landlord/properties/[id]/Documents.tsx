interface DocumentsProps {
  propertyId: string;
}

export function Documents({ propertyId }: DocumentsProps) {
  return (
    <div>
      <h2>Documents</h2>
      <p>Property ID: {propertyId}</p>
      {/* Add your documents content here */}
    </div>
  );
}
