package com.medichain.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    @Autowired(required = false)   // optional — won't crash if SMTP not configured
    private JavaMailSender mailSender;

    @Async
    public void sendEmail(String to, String subject, String body) {
        if (mailSender == null) {
            log.info("Email skipped (SMTP not configured): {} — {}", to, subject);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("[MediChain AI] " + subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendClaimApproved(String patientEmail, String patientName,
                                   String claimType, double adaAmount, String txHash) {
        sendEmail(patientEmail,
            "Insurance Claim Approved — ₳" + adaAmount + " Released",
            String.format("""
                Dear %s,
                
                Your insurance claim has been approved by our AI agent.
                
                Claim Type: %s
                Amount Released: ₳%.2f ADA
                Transaction: %s
                
                The ADA has been sent directly to your Cardano wallet.
                
                Thank you for using MediChain AI — The Trust Layer for Healthcare.
                """, patientName, claimType, adaAmount, txHash)
        );
    }

    @Async
    public void sendPrescriptionIssued(String patientEmail, String patientName, String doctorName) {
        sendEmail(patientEmail,
            "New Prescription Issued",
            String.format("""
                Dear %s,
                
                Dr. %s has issued a new prescription for you.
                
                Your prescription has been minted as an NFT on the Cardano blockchain.
                You can view it in your MediChain AI dashboard and present it to any pharmacy.
                
                MediChain AI — The Trust Layer for Healthcare
                """, patientName, doctorName)
        );
    }

    @Async
    public void sendHumanApprovalRequired(String officerEmail, String workflowId,
                                          String reason, String approvalUrl) {
        sendEmail(officerEmail,
            "ACTION REQUIRED — Manual Review Needed",
            String.format("""
                A workflow requires your manual review.
                
                Workflow ID: %s
                Reason: %s
                
                Review and approve/reject here: %s
                
                MediChain AI — Automated Claims Processing
                """, workflowId, reason, approvalUrl)
        );
    }
}
