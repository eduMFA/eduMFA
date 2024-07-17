# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import eduMFA.lib.caconnectors.caservice_pb2 as caservice__pb2


class CAServiceStub:
    """Disposition values:
    0 - Incomplete
    1 - Error
    2 - Denied
    3 - Issued
    4 - Issued out of band
    5 - Under Submission

    """

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.SubmitCSR = channel.unary_unary(
            "/CAService/SubmitCSR",
            request_serializer=caservice__pb2.SubmitCSRRequest.SerializeToString,
            response_deserializer=caservice__pb2.SubmitCSRReply.FromString,
        )
        self.GetCAs = channel.unary_unary(
            "/CAService/GetCAs",
            request_serializer=caservice__pb2.GetCAsRequest.SerializeToString,
            response_deserializer=caservice__pb2.GetCAsReply.FromString,
        )
        self.GetCertificate = channel.unary_unary(
            "/CAService/GetCertificate",
            request_serializer=caservice__pb2.GetCertificateRequest.SerializeToString,
            response_deserializer=caservice__pb2.GetCertificateReply.FromString,
        )
        self.GetTemplates = channel.unary_unary(
            "/CAService/GetTemplates",
            request_serializer=caservice__pb2.GetTemplatesRequest.SerializeToString,
            response_deserializer=caservice__pb2.GetTemplatesReply.FromString,
        )
        self.GetCSRStatus = channel.unary_unary(
            "/CAService/GetCSRStatus",
            request_serializer=caservice__pb2.GetCSRStatusRequest.SerializeToString,
            response_deserializer=caservice__pb2.GetCSRStatusReply.FromString,
        )
        self.SetOption = channel.unary_unary(
            "/CAService/SetOption",
            request_serializer=caservice__pb2.SetOptionRequest.SerializeToString,
            response_deserializer=caservice__pb2.SetOptionReply.FromString,
        )
        self.GetOptions = channel.unary_unary(
            "/CAService/GetOptions",
            request_serializer=caservice__pb2.GetOptionsRequest.SerializeToString,
            response_deserializer=caservice__pb2.GetOptionsReply.FromString,
        )


class CAServiceServicer:
    """Disposition values:
    0 - Incomplete
    1 - Error
    2 - Denied
    3 - Issued
    4 - Issued out of band
    5 - Under Submission

    """

    def SubmitCSR(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def GetCAs(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def GetCertificate(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def GetTemplates(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def GetCSRStatus(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def SetOption(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def GetOptions(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")


def add_CAServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
        "SubmitCSR": grpc.unary_unary_rpc_method_handler(
            servicer.SubmitCSR,
            request_deserializer=caservice__pb2.SubmitCSRRequest.FromString,
            response_serializer=caservice__pb2.SubmitCSRReply.SerializeToString,
        ),
        "GetCAs": grpc.unary_unary_rpc_method_handler(
            servicer.GetCAs,
            request_deserializer=caservice__pb2.GetCAsRequest.FromString,
            response_serializer=caservice__pb2.GetCAsReply.SerializeToString,
        ),
        "GetCertificate": grpc.unary_unary_rpc_method_handler(
            servicer.GetCertificate,
            request_deserializer=caservice__pb2.GetCertificateRequest.FromString,
            response_serializer=caservice__pb2.GetCertificateReply.SerializeToString,
        ),
        "GetTemplates": grpc.unary_unary_rpc_method_handler(
            servicer.GetTemplates,
            request_deserializer=caservice__pb2.GetTemplatesRequest.FromString,
            response_serializer=caservice__pb2.GetTemplatesReply.SerializeToString,
        ),
        "GetCSRStatus": grpc.unary_unary_rpc_method_handler(
            servicer.GetCSRStatus,
            request_deserializer=caservice__pb2.GetCSRStatusRequest.FromString,
            response_serializer=caservice__pb2.GetCSRStatusReply.SerializeToString,
        ),
        "SetOption": grpc.unary_unary_rpc_method_handler(
            servicer.SetOption,
            request_deserializer=caservice__pb2.SetOptionRequest.FromString,
            response_serializer=caservice__pb2.SetOptionReply.SerializeToString,
        ),
        "GetOptions": grpc.unary_unary_rpc_method_handler(
            servicer.GetOptions,
            request_deserializer=caservice__pb2.GetOptionsRequest.FromString,
            response_serializer=caservice__pb2.GetOptionsReply.SerializeToString,
        ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
        "CAService", rpc_method_handlers
    )
    server.add_generic_rpc_handlers((generic_handler,))


# This class is part of an EXPERIMENTAL API.
class CAService:
    """Disposition values:
    0 - Incomplete
    1 - Error
    2 - Denied
    3 - Issued
    4 - Issued out of band
    5 - Under Submission

    """

    @staticmethod
    def SubmitCSR(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/SubmitCSR",
            caservice__pb2.SubmitCSRRequest.SerializeToString,
            caservice__pb2.SubmitCSRReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def GetCAs(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/GetCAs",
            caservice__pb2.GetCAsRequest.SerializeToString,
            caservice__pb2.GetCAsReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def GetCertificate(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/GetCertificate",
            caservice__pb2.GetCertificateRequest.SerializeToString,
            caservice__pb2.GetCertificateReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def GetTemplates(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/GetTemplates",
            caservice__pb2.GetTemplatesRequest.SerializeToString,
            caservice__pb2.GetTemplatesReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def GetCSRStatus(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/GetCSRStatus",
            caservice__pb2.GetCSRStatusRequest.SerializeToString,
            caservice__pb2.GetCSRStatusReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def SetOption(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/SetOption",
            caservice__pb2.SetOptionRequest.SerializeToString,
            caservice__pb2.SetOptionReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def GetOptions(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/CAService/GetOptions",
            caservice__pb2.GetOptionsRequest.SerializeToString,
            caservice__pb2.GetOptionsReply.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )
