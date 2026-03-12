// Listing Details Page - Redirects to Material Details
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/config/constants";

const ListingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={ROUTES.MATERIAL_DETAILS.replace(":id", id || "")} replace />;
};

export default ListingDetailsPage;
